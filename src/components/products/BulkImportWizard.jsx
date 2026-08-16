import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Wand2, Loader2, CheckCircle, XCircle, AlertTriangle,
  FileText, Table, Code, Globe, ChevronRight, ChevronLeft,
  Sparkles, RefreshCw, Download, ImageIcon, Tag, FileSearch
} from "lucide-react";

// ─── Step constants ──────────────────────────────────────────────────────────
const STEPS = ["upload", "mapping", "cleaning", "preview", "importing", "done"];
const STEP_LABELS = ["Ladda upp", "Fältmappning", "AI-rensning", "Förhandsgranskning", "Importerar", "Klar"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PRODUCT_FIELDS = [
  { key: "product_title", label: "Produktnamn", required: true },
  { key: "scientific_name", label: "Vetenskapligt namn" },
  { key: "price", label: "Pris (SEK)", required: true },
  { key: "regular_price", label: "Ordinarie pris" },
  { key: "description", label: "Beskrivning" },
  { key: "image_url", label: "Bild-URL" },
  { key: "image_alt", label: "Bild ALT-text" },
  { key: "category", label: "Kategori" },
  { key: "product_url", label: "Produkt-URL" },
  { key: "availability", label: "Tillgänglighet" },
  { key: "pot_size", label: "Krukstorlek" },
  { key: "seo_title", label: "SEO-titel" },
  { key: "meta_description", label: "Meta-beskrivning" },
];

function guessMapping(headers) {
  const map = {};
  const rules = {
    product_title: ["name","title","product","produktnamn","produkt","namn"],
    scientific_name: ["scientific","latin","botanisk","botanical","species"],
    price: ["price","pris","sale_price","selling_price","aktuellt_pris"],
    regular_price: ["regular_price","original_price","ordinarie","normalpris","was"],
    description: ["description","beskrivning","text","body","content"],
    image_url: ["image","bild","img","photo","thumbnail","image_url","bild_url"],
    image_alt: ["alt","image_alt","alt_text"],
    category: ["category","kategori","type","typ"],
    product_url: ["url","link","product_url","produkt_url","href"],
    availability: ["availability","stock","lager","in_stock","status"],
    pot_size: ["pot","kruka","size","storlek","pot_size"],
    seo_title: ["seo_title","seo","meta_title"],
    meta_description: ["meta_description","meta","description"],
  };
  for (const [field, aliases] of Object.entries(rules)) {
    const found = headers.find(h => aliases.some(a => h.toLowerCase().replace(/[\s-]/g,"_").includes(a)));
    if (found) map[field] = found;
  }
  return map;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

function parseJSON(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data.products || data.items || data.data || Object.values(data)[0] || []);
  const headers = arr.length ? Object.keys(arr[0]) : [];
  return { headers, rows: arr };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            i < STEPS.indexOf(current) ? "bg-primary text-primary-foreground" :
            i === STEPS.indexOf(current) ? "bg-primary/20 text-primary border border-primary/40" :
            "bg-muted text-muted-foreground"
          }`}>
            {i < STEPS.indexOf(current) ? <CheckCircle className="w-3 h-3" /> : <span>{i+1}</span>}
            {STEP_LABELS[i]}
          </div>
          {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function FieldSelect({ value, onChange, headers }) {
  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value || undefined)}
      className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="">— ignorera —</option>
      {headers.map(h => <option key={h} value={h}>{h}</option>)}
    </select>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BulkImportWizard() {
  const fileRef = useRef();
  const [step, setStep] = useState("upload");
  const [source, setSource] = useState("file");    // file | api
  const [apiUrl, setApiUrl] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [cleaned, setCleaned] = useState([]);      // mapped + AI-enriched rows
  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState("");
  const [aiProgress, setAiProgress] = useState({ done: 0, total: 0, phase: "" });
  const [errors, setErrors] = useState([]);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importedCount, setImportedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);

  // Load sellers once
  useState(() => { base44.entities.Seller.list().then(setSellers); });

  // ── Step 1: Upload ──────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setLoadingFile(true);
    setErrors([]);
    try {
      let parsed;
      const name = file.name.toLowerCase();
      if (name.endsWith(".csv")) {
        const text = await file.text();
        parsed = parseCSV(text);
      } else if (name.endsWith(".json")) {
        const text = await file.text();
        parsed = parseJSON(text);
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xml")) {
        const url = await base44.integrations.Core.UploadFile({ file });
        const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: url.file_url,
          json_schema: { type: "object", properties: { product_name: {type:"string"}, price: {type:"number"} } }
        });
        if (res.status !== "success") throw new Error("Kunde inte läsa filen: " + (res.details || "okänt fel"));
        const arr = Array.isArray(res.output) ? res.output : [res.output];
        parsed = { headers: Object.keys(arr[0] || {}), rows: arr };
      } else {
        throw new Error("Filformat stöds inte. Använd CSV, JSON, XLSX eller XML.");
      }
      if (!parsed.rows.length) throw new Error("Filen verkar vara tom.");
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(guessMapping(parsed.headers));
      setStep("mapping");
    } catch (e) {
      setErrors([e.message]);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleApiLoad = async () => {
    if (!apiUrl.trim()) return;
    setLoadingApi(true);
    setErrors([]);
    try {
      const res = await fetch(apiUrl.trim());
      if (!res.ok) throw new Error(`API svarade med ${res.status}`);
      const text = await res.text();
      let parsed;
      try { parsed = parseJSON(text); } catch { parsed = parseCSV(text); }
      if (!parsed.rows.length) throw new Error("API-svaret innehöll inga produkter.");
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(guessMapping(parsed.headers));
      setStep("mapping");
    } catch (e) {
      setErrors([e.message]);
    } finally {
      setLoadingApi(false);
    }
  };

  // ── Step 2 → 3: AI Cleaning ──────────────────────────────────────────────
  const runAICleaning = async () => {
    setStep("cleaning");
    const BATCH = 20;
    const total = rawRows.length;
    setAiProgress({ done: 0, total, phase: "Förbereder..." });

    // First map raw rows → base objects using field mapping
    const mapped = rawRows.map(row => {
      const obj = {};
      for (const [field, col] of Object.entries(mapping)) {
        if (col && row[col] !== undefined) obj[field] = row[col];
      }
      obj._seller_id = sellerId;
      return obj;
    });

    const result = [];

    for (let i = 0; i < mapped.length; i += BATCH) {
      const batch = mapped.slice(i, i + BATCH);
      setAiProgress({ done: i, total, phase: `Rengör & berikar rad ${i+1}–${Math.min(i+BATCH, total)}` });

      const aiRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are enriching plant product data for a Swedish e-commerce marketplace.

For each product in the array below:
1. Clean and normalize product_title (remove junk, fix capitalization)
2. Detect or verify scientific_name (Latin botanical name)
3. Normalize category to one of: tropical/succulent/cactus/fern/orchid/palm/herb/tree/climbing/rose/other
4. If description is empty or too short (<30 chars), generate a short Swedish description (2-3 sentences)
5. Generate image_alt text in Swedish describing the plant (max 100 chars)
6. Generate seo_title in Swedish (55-60 chars, include plant name + "köp")
7. Generate meta_description in Swedish (150-160 chars, include benefits + CTA)
8. Normalize availability to: in_stock / out_of_stock / limited
9. Ensure price is a number (remove "kr", "SEK", spaces, commas → dots)
10. Ensure regular_price is a number or null

Return the same array with all fields filled/improved. Keep original values if already good.

Products:
${JSON.stringify(batch, null, 2)}`,
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_title: { type: "string" },
                  scientific_name: { type: "string" },
                  price: { type: "number" },
                  regular_price: { type: "number" },
                  description: { type: "string" },
                  image_url: { type: "string" },
                  image_alt: { type: "string" },
                  category: { type: "string" },
                  product_url: { type: "string" },
                  availability: { type: "string" },
                  pot_size: { type: "string" },
                  seo_title: { type: "string" },
                  meta_description: { type: "string" },
                  _seller_id: { type: "string" },
                }
              }
            }
          }
        }
      });

      const enriched = Array.isArray(aiRes?.products) ? aiRes.products : batch;
      result.push(...enriched);
      setAiProgress({ done: Math.min(i + BATCH, total), total, phase: `Rengör & berikar rad ${i+1}–${Math.min(i+BATCH, total)}` });
    }

    setCleaned(result);
    setStep("preview");
  };

  // ── Step 4 → 5: Import ──────────────────────────────────────────────────
  const runImport = async () => {
    setStep("importing");
    const total = cleaned.length;
    setImportProgress({ done: 0, total });

    // Fetch existing products for duplicate/price-update detection
    const existing = await base44.entities.Product.list("-created_date", 1000);
    const existingMap = {};
    for (const p of existing) existingMap[p.product_url || p.product_title] = p;

    const now = new Date().toISOString();
    let imported = 0;
    let histSaved = 0;
    const CHUNK = 50;

    const toCreate = [];
    const toUpdate = [];
    const historyRecords = [];

    for (const row of cleaned) {
      const price = parseFloat(row.price) || 0;
      const regularPrice = parseFloat(row.regular_price);
      const key = row.product_url || row.product_title;
      const existing_ = existingMap[key];

      const record = {
        product_title: row.product_title || "Okänd växt",
        price,
        regular_price: (regularPrice && regularPrice !== price) ? regularPrice : undefined,
        currency: "SEK",
        product_url: row.product_url?.startsWith("http") ? row.product_url : undefined,
        image_url: row.image_url?.startsWith("http") ? row.image_url : undefined,
        availability: ["in_stock","out_of_stock","limited"].includes(row.availability) ? row.availability : "in_stock",
        seller_id: row._seller_id || sellerId || undefined,
        pot_size: row.pot_size || undefined,
        last_checked: now,
      };

      if (existing_) {
        // Update price/stock if changed
        if (existing_.price !== price || existing_.availability !== record.availability) {
          toUpdate.push({ id: existing_.id, data: record });
          historyRecords.push({ product_id: existing_.id, price, currency: "SEK", availability: record.availability, date_checked: now });
        }
      } else {
        toCreate.push(record);
      }
    }

    // Bulk create new
    for (let i = 0; i < toCreate.length; i += CHUNK) {
      const chunk = toCreate.slice(i, i + CHUNK);
      const created = await base44.entities.Product.bulkCreate(chunk);
      imported += chunk.length;
      // Save price history for new products
      if (Array.isArray(created)) {
        for (const p of created) {
          historyRecords.push({ product_id: p.id, price: p.price, currency: "SEK", availability: p.availability, date_checked: now });
        }
      }
      setImportProgress({ done: i + chunk.length, total: toCreate.length + toUpdate.length });
    }

    // Update existing
    for (let i = 0; i < toUpdate.length; i++) {
      await base44.entities.Product.update(toUpdate[i].id, toUpdate[i].data);
      imported++;
      setImportProgress({ done: toCreate.length + i + 1, total: toCreate.length + toUpdate.length });
    }

    // Bulk save price history
    if (historyRecords.length) {
      for (let i = 0; i < historyRecords.length; i += CHUNK) {
        await base44.entities.PriceHistory.bulkCreate(historyRecords.slice(i, i + CHUNK));
      }
      histSaved = historyRecords.length;
    }

    setImportedCount(imported);
    setHistoryCount(histSaved);
    setStep("done");
  };

  const reset = () => {
    setStep("upload"); setRawRows([]); setHeaders([]); setMapping({});
    setCleaned([]); setErrors([]); setSellerId(""); setApiUrl("");
    setImportedCount(0); setHistoryCount(0);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">Bulk Import-guide</h2>
          <p className="text-sm text-muted-foreground">Importera tusentals produkter — AI rensar, berikar och sparar prishistorik automatiskt</p>
        </div>
      </div>

      <StepBar current={step} />

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Source toggle */}
          <div className="flex gap-2">
            {[["file","Fil (CSV/XLSX/JSON/XML)"],["api","API-feed (URL)"]].map(([v,l]) => (
              <button key={v} onClick={() => setSource(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${source===v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
                {l}
              </button>
            ))}
          </div>

          {source === "file" && (
            <div
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            >
              <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls,.xml" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              {loadingFile
                ? <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
                : <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />}
              <p className="font-medium text-foreground">Dra & släpp eller klicka för att ladda upp</p>
              <p className="text-sm text-muted-foreground mt-1">CSV, JSON, XLSX, XLS eller XML · Ingen gräns för antal rader</p>
              <div className="flex justify-center gap-3 mt-4">
                {[["CSV", FileText],["XLSX", Table],["JSON", Code],["XML", FileSearch]].map(([fmt, Icon]) => (
                  <div key={fmt} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                    <Icon className="w-3.5 h-3.5" />{fmt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {source === "api" && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleApiLoad()}
                    placeholder="https://api.example.com/products.json" className="pl-9 rounded-xl" />
                </div>
                <Button onClick={handleApiLoad} disabled={loadingApi || !apiUrl.trim()} className="rounded-xl gap-2">
                  {loadingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Hämta
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Stöder JSON- och CSV-svar. Produkterna hämtas direkt från URL:en.</p>
            </div>
          )}

          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />{e}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 2: Mapping ── */}
      {step === "mapping" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Fältmappning</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{rawRows.length} rader laddade · Mappa kolumner till produktfält</p>
              </div>
              <Badge variant="outline">{Object.values(mapping).filter(Boolean).length}/{PRODUCT_FIELDS.length} mappade</Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {PRODUCT_FIELDS.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-36 shrink-0">
                    <span className="text-xs font-medium">{label}</span>
                    {required && <span className="text-destructive ml-1 text-xs">*</span>}
                  </div>
                  <FieldSelect value={mapping[key]} onChange={v => setMapping(m => ({ ...m, [key]: v }))} headers={headers} />
                </div>
              ))}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/40">
              <span className="text-sm font-medium w-36 shrink-0">Tilldela butik</span>
              <select value={sellerId} onChange={e => setSellerId(e.target.value)}
                className="h-9 w-60 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">— välj butik —</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.seller_name}</option>)}
              </select>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground">Förhandsgranskning — första 5 rader</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30">{headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {rawRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border/40">
                      {headers.map(h => <td key={h} className="px-3 py-2 max-w-[140px] truncate text-foreground">{row[h] ?? ""}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("upload")} className="rounded-xl gap-1"><ChevronLeft className="w-4 h-4" />Tillbaka</Button>
            <Button onClick={runAICleaning} disabled={!mapping.product_title || !mapping.price} className="rounded-xl gap-2">
              <Sparkles className="w-4 h-4" />AI-rensning & berikande →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Cleaning progress ── */}
      {step === "cleaning" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-display text-xl text-foreground mb-1">AI bearbetar produkterna</h3>
              <p className="text-sm text-muted-foreground">{aiProgress.phase}</p>
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <Progress value={aiProgress.total ? (aiProgress.done / aiProgress.total) * 100 : 0} className="h-3 rounded-full" />
              <p className="text-xs text-muted-foreground">{aiProgress.done} / {aiProgress.total} produkter</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              {[
                [Wand2, "Rensar produktnamn"],
                [Tag, "Identifierar vetenskapliga namn"],
                [FileText, "Genererar beskrivningar"],
                [ImageIcon, "Skapar ALT-texter"],
                [Globe, "Bygger SEO-metadata"],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                  <Icon className="w-3.5 h-3.5" />{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">Förhandsgranskning efter AI-rensning</h3>
              <p className="text-sm text-muted-foreground">{cleaned.length} produkter redo för import</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />{cleaned.filter(p => p.scientific_name).length} med vetenskapligt namn
              </Badge>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                <Globe className="w-3 h-3 mr-1" />{cleaned.filter(p => p.seo_title).length} med SEO
              </Badge>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    {["Produktnamn","Vet. namn","Kategori","Pris","Bild ALT","SEO-titel","Status"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleaned.map((p, i) => (
                    <tr key={i} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="px-3 py-2 max-w-[180px] truncate font-medium">{p.product_title}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate italic text-muted-foreground">{p.scientific_name || "—"}</td>
                      <td className="px-3 py-2"><Badge variant="secondary" className="text-xs capitalize">{p.category || "other"}</Badge></td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.price ? `${Number(p.price).toFixed(0)} kr` : "—"}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate text-muted-foreground">{p.image_alt || "—"}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate text-muted-foreground">{p.seo_title || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={p.availability === "out_of_stock" ? "destructive" : "outline"} className="text-xs">
                          {p.availability === "in_stock" ? "I lager" : p.availability === "out_of_stock" ? "Slut" : "Begränsad"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("mapping")} className="rounded-xl gap-1"><ChevronLeft className="w-4 h-4" />Tillbaka</Button>
            <Button onClick={runImport} className="rounded-xl gap-2 px-8">
              <Upload className="w-4 h-4" />Importera {cleaned.length} produkter →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Importing ── */}
      {step === "importing" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="font-display text-xl text-foreground mb-1">Importerar produkter</h3>
            <p className="text-sm text-muted-foreground">Sparar produkter & prishistorik…</p>
          </div>
          <div className="max-w-sm mx-auto space-y-2">
            <Progress value={importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0} className="h-3 rounded-full" />
            <p className="text-xs text-muted-foreground">{importProgress.done} / {importProgress.total}</p>
          </div>
        </div>
      )}

      {/* ── Step 6: Done ── */}
      {step === "done" && (
        <div className="bg-card border border-green-200 rounded-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="font-display text-2xl text-foreground mb-2">Import klar!</h3>
            <p className="text-muted-foreground text-sm">Alla produkter är bearbetade och sparade.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-display text-green-700">{importedCount}</p>
              <p className="text-xs text-green-600 mt-0.5">Produkter importerade</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-display text-primary">{historyCount}</p>
              <p className="text-xs text-primary/70 mt-0.5">Prishistorik sparad</p>
            </div>
          </div>
          <Button onClick={reset} className="rounded-xl gap-2 px-8">
            <RefreshCw className="w-4 h-4" />Ny import
          </Button>
        </div>
      )}
    </div>
  );
}