import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

const FIELD_MAP = {
  product_title: ["product name", "title", "namn", "produktnamn", "name"],
  price: ["price", "pris", "sale price", "current price"],
  regular_price: ["regular price", "original price", "ordinarie pris", "ord pris"],
  currency: ["currency", "valuta"],
  image_url: ["image", "image url", "bild", "bild url", "img"],
  product_url: ["url", "product url", "produkt url", "link"],
  availability: ["stock", "availability", "lager", "tillgänglighet"],
  pot_size: ["pot size", "krukstorlek", "pot"],
  seller_id: ["seller", "butik", "store"],
};

function autoMapColumns(headers) {
  const mapping = {};
  headers.forEach(h => {
    const lh = h.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.some(a => lh.includes(a))) {
        if (!mapping[field]) mapping[field] = h;
      }
    }
  });
  return mapping;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || "").replace(/^"|"$/g, "").trim(); });
    return row;
  });
}

function parseJSON(text) {
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : data.products || data.items || [data];
}

export default function ProductImport() {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => { base44.entities.Seller.list().then(setSellers).catch(() => {}); }, []);

  const processFile = async (file) => {
    setDone(null);
    const ext = file.name.split(".").pop().toLowerCase();
    let rows = [];

    if (ext === "json") {
      const text = await file.text();
      rows = parseJSON(text);
    } else if (ext === "csv" || ext === "txt") {
      const text = await file.text();
      rows = parseCSV(text);
    } else if (ext === "xml") {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");
      const items = Array.from(doc.querySelectorAll("product, item, row"));
      rows = items.map(el => {
        const obj = {};
        Array.from(el.children).forEach(child => { obj[child.tagName] = child.textContent; });
        return obj;
      });
    } else if (ext === "xlsx" || ext === "xls") {
      // Use AI extraction for Excel
      setImporting(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            product_title: { type: "string" },
            price: { type: "number" },
            regular_price: { type: "number" },
            image_url: { type: "string" },
            product_url: { type: "string" },
            availability: { type: "string" },
            pot_size: { type: "string" },
          }
        }
      });
      setImporting(false);
      if (res.status === "success") {
        const extracted = Array.isArray(res.output) ? res.output : [res.output];
        setRawRows(extracted);
        setHeaders(Object.keys(extracted[0] || {}));
        const m = autoMapColumns(Object.keys(extracted[0] || {}));
        setMapping(m);
        buildPreview(extracted, m);
      }
      return;
    }

    if (rows.length) {
      const hdrs = Object.keys(rows[0]);
      setRawRows(rows);
      setHeaders(hdrs);
      const m = autoMapColumns(hdrs);
      setMapping(m);
      buildPreview(rows, m);
    }
  };

  const buildPreview = (rows, m) => {
    const mapped = rows.slice(0, 50).map(row => {
      const p = {};
      for (const [field, col] of Object.entries(m)) {
        if (col && row[col] !== undefined) p[field] = row[col];
      }
      return p;
    });
    setPreview(mapped);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (file) processFile(file);
  };

  const runImport = async () => {
    if (!selectedSeller) return alert("Välj en butik innan import.");
    setImporting(true);
    const items = rawRows.map(row => {
      const p = { seller_id: selectedSeller };
      for (const [field, col] of Object.entries(mapping)) {
        if (col && row[col] !== undefined) p[field] = row[col];
      }
      if (p.price) p.price = parseFloat(p.price) || 0;
      if (p.regular_price) p.regular_price = parseFloat(p.regular_price) || undefined;
      p.last_checked = new Date().toISOString();
      p.currency = p.currency || "SEK";
      return p;
    }).filter(p => p.product_title && p.price);

    try {
      await base44.entities.Product.bulkCreate(items);
      setDone({ success: items.length, total: rawRows.length });
    } catch (e) {
      alert("Import misslyckades: " + e.message);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,.json,.xml,.xlsx,.xls" className="hidden" onChange={handleFileDrop} />
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-foreground">Dra & släpp fil här eller klicka för att välja</p>
        <p className="text-sm text-muted-foreground mt-1">CSV, JSON, XML, XLSX, XLS</p>
      </div>

      {importing && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Bearbetar fil...
        </div>
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">{done.success} av {done.total} produkter importerade!</p>
          <Button variant="ghost" size="sm" onClick={() => { setDone(null); setPreview([]); setRawRows([]); }}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      )}

      {/* Seller select */}
      {rawRows.length > 0 && (
        <div className="space-y-1 max-w-xs">
          <Label>Tilldela butik</Label>
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Välj butik..." /></SelectTrigger>
            <SelectContent>
              {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Field mapping */}
      {headers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-foreground">Fältmappning</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(FIELD_MAP).map(([field]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs capitalize">{field.replace(/_/g, " ")}</Label>
                <Select value={mapping[field] || ""} onValueChange={v => setMapping(m => ({ ...m, [field]: v }))}>
                  <SelectTrigger className="text-xs h-8 rounded-lg"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>— Hoppa över —</SelectItem>
                    {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Förhandsgranskning ({Math.min(rawRows.length, 50)} av {rawRows.length})</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {preview.filter(p => p.product_title && p.price).length} giltiga</Badge>
              <Badge variant="outline" className="gap-1"><XCircle className="w-3 h-3 text-destructive" /> {preview.filter(p => !p.product_title || !p.price).length} ogiltiga</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Titel</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Pris</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Bild</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {preview.map((p, i) => {
                    const valid = p.product_title && p.price;
                    return (
                      <tr key={i} className={valid ? "" : "bg-destructive/5"}>
                        <td className="px-3 py-2 max-w-[200px] truncate">{p.product_title || <span className="text-destructive">Saknas</span>}</td>
                        <td className="px-3 py-2 text-right">{p.price ? `${p.price} kr` : <span className="text-destructive">Saknas</span>}</td>
                        <td className="px-3 py-2 text-center">
                          {valid
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto" />
                            : <XCircle className="w-3.5 h-3.5 text-destructive mx-auto" />}
                        </td>
                        <td className="px-3 py-2">{p.image_url ? "✓" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Button onClick={runImport} disabled={importing || !selectedSeller} className="gap-2">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? "Importerar..." : `Importera ${rawRows.filter((_, i) => preview[i]?.product_title && preview[i]?.price).length} produkter`}
          </Button>
        </div>
      )}
    </div>
  );
}