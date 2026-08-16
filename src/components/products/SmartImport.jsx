import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wand2, Loader2, Globe, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, ShoppingCart, Import
} from "lucide-react";

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          product_name:    { type: "string" },
          scientific_name: { type: "string" },
          price:           { type: "number" },
          sale_price:      { type: "number" },
          description:     { type: "string" },
          image_url:       { type: "string" },
          category:        { type: "string" },
          product_url:     { type: "string" },
          seller_name:     { type: "string" },
          availability:    { type: "string" },
        }
      }
    },
    seller_name: { type: "string" }
  }
};

const CATEGORIES = ["tropical","succulent","cactus","fern","orchid","palm","herb","tree","climbing","rose","other"];

function similarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  const w1 = new Set(s1.split(/\s+/));
  const w2 = new Set(s2.split(/\s+/));
  const intersection = [...w1].filter(w => w2.has(w)).length;
  return intersection / Math.max(w1.size, w2.size);
}

function toAvailability(str) {
  if (!str) return "in_stock";
  const s = str.toLowerCase();
  if (s.includes("out") || s.includes("slut")) return "out_of_stock";
  if (s.includes("limited") || s.includes("begränsad") || s.includes("få kvar")) return "limited";
  return "in_stock";
}

function normCategory(cat) {
  if (!cat) return "other";
  const c = cat.toLowerCase();
  for (const k of CATEGORIES) {
    if (c.includes(k)) return k;
  }
  if (c.includes("succ")) return "succulent";
  if (c.includes("tropic") || c.includes("tropisk")) return "tropical";
  if (c.includes("palm")) return "palm";
  if (c.includes("orchi") || c.includes("orkidé")) return "orchid";
  return "other";
}

export default function SmartImport() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState([]);  // { ...product, _status, _dup }
  const [error, setError] = useState("");
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [existingProducts, setExistingProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [approved, setApproved] = useState(new Set());
  const [rejected, setRejected] = useState(new Set());

  useEffect(() => {
    Promise.all([base44.entities.Seller.list(), base44.entities.Product.list("-created_date", 500)])
      .then(([sels, prods]) => { setSellers(sels); setExistingProducts(prods); });
  }, []);

  const scan = async () => {
    if (!url.trim()) return;
    setError("");
    setScanned([]);
    setApproved(new Set());
    setRejected(new Set());
    setImportDone(false);
    setScanning(true);

    try {
      // Step 1: distill page content via Thunderbit
      const distillRes = await base44.functions.invoke("thunderbitScraper", {
        action: "distill",
        url: url.trim(),
        renderMode: "basic"
      });

      const markdown = distillRes.data?.markdown || distillRes.data?.data?.markdown || "";
      if (!markdown) throw new Error("Kunde inte hämta sidans innehåll. Kontrollera URL:en.");

      // Step 2: AI extracts structured product list from markdown
      const aiRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are extracting plant products from a web page content (markdown).
Page URL: ${url.trim()}

Content:
${markdown.slice(0, 12000)}

Extract ALL plant products listed on this page. For each product extract:
- product_name: full name as shown (keep Swedish names)
- scientific_name: Latin botanical name if present
- price: current/sale price as a number (SEK)
- sale_price: original/regular price if discounted, else null
- description: short product description
- image_url: full image URL if found
- category: one of tropical/succulent/cactus/fern/orchid/palm/herb/tree/climbing/rose/other
- product_url: direct product page URL (combine with base domain if relative)
- seller_name: store/shop name from the page
- availability: "in_stock", "out_of_stock", or "limited"

Return all products found. If a field is not present, return null.`,
        response_json_schema: EXTRACT_SCHEMA
      });

      const raw = Array.isArray(aiRes?.products) ? aiRes.products
        : Array.isArray(aiRes) ? aiRes : [];

      if (!raw.length) throw new Error("AI hittade inga produkter på sidan. Prova en kategorisida.");

      // Step 3: mark duplicates
      const withMeta = raw.map((p, idx) => {
        const dup = existingProducts.find(ex => similarity(ex.product_title, p.product_name) >= 0.8);
        return {
          _id: idx,
          _status: "pending",    // pending | approved | rejected
          _dup: dup ? { id: dup.id, title: dup.product_title } : null,
          ...p
        };
      });

      setScanned(withMeta);

      // Auto-approve non-duplicates
      const autoApproved = new Set(withMeta.filter(p => !p._dup).map(p => p._id));
      setApproved(autoApproved);

    } catch (err) {
      setError(err.message || "Något gick fel vid skanning.");
    } finally {
      setScanning(false);
    }
  };

  const toggle = (id, type) => {
    if (type === "approve") {
      setApproved(prev => { const n = new Set(prev); n.add(id); return n; });
      setRejected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setRejected(prev => { const n = new Set(prev); n.add(id); return n; });
      setApproved(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const approveAll = () => {
    setApproved(new Set(scanned.map(p => p._id)));
    setRejected(new Set());
  };

  const importApproved = async () => {
    const toImport = scanned.filter(p => approved.has(p._id));
    if (!toImport.length) return;
    setImporting(true);
    const records = toImport.map(p => ({
      product_title: p.product_name || "Okänd produkt",
      price: parseFloat(p.price) || 0,
      regular_price: p.sale_price && parseFloat(p.sale_price) !== parseFloat(p.price) ? parseFloat(p.sale_price) : undefined,
      currency: "SEK",
      product_url: p.product_url?.startsWith("http") ? p.product_url : undefined,
      image_url: p.image_url?.startsWith("http") ? p.image_url : undefined,
      availability: toAvailability(p.availability),
      seller_id: selectedSellerId || undefined,
      last_checked: new Date().toISOString(),
    }));
    await base44.entities.Product.bulkCreate(records);
    setImporting(false);
    setImportDone(true);
  };

  const approvedCount = approved.size;
  const rejectedCount = rejected.size;
  const pendingCount = scanned.length - approvedCount - rejectedCount;
  const dupCount = scanned.filter(p => p._dup).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">Smart Produktimport</h2>
          <p className="text-sm text-muted-foreground">Klistra in en webbadress — AI extraherar produkterna automatiskt</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && scan()}
              placeholder="https://www.blomsterlandet.se/produkter/krukvaxter/"
              className="pl-9 rounded-xl"
            />
          </div>
          <Button onClick={scan} disabled={scanning || !url.trim()} className="rounded-xl gap-2 px-6">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {scanning ? "Skannar..." : "Skanna"}
          </Button>
        </div>

        {/* Seller selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Tilldela butik:</span>
          <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
            <SelectTrigger className="w-60 rounded-xl text-sm h-9">
              <SelectValue placeholder="Välj butik (valfritt)..." />
            </SelectTrigger>
            <SelectContent>
              {sellers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {scanning && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>AI skannar sidan och extraherar produkter…</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Skanningen misslyckades</p>
            <p className="text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Import Done */}
      {importDone && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{approvedCount} produkt(er) importerade! De är nu tillgängliga under "Produkter".</span>
        </div>
      )}

      {/* Preview */}
      {scanned.length > 0 && !importDone && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <span className="font-medium text-sm">{scanned.length} produkter hittade</span>
            <div className="flex gap-2 flex-wrap">
              {dupCount > 0 && <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">{dupCount} möjliga dubbletter</Badge>}
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">{approvedCount} godkända</Badge>
              {rejectedCount > 0 && <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">{rejectedCount} avvisade</Badge>}
              {pendingCount > 0 && <Badge variant="outline">{pendingCount} väntar</Badge>}
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={approveAll} className="rounded-xl text-xs h-8">Godkänn alla</Button>
              <Button size="sm" onClick={importApproved} disabled={!approvedCount || importing} className="rounded-xl text-xs h-8 gap-1">
                {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Import className="w-3 h-3" />}
                Importera {approvedCount} st
              </Button>
            </div>
          </div>

          {/* Product cards */}
          <div className="space-y-2">
            {scanned.map((p) => {
              const isApproved = approved.has(p._id);
              const isRejected = rejected.has(p._id);
              const isExpanded = expanded === p._id;
              const borderColor = isApproved ? "border-green-200" : isRejected ? "border-destructive/30" : p._dup ? "border-orange-200" : "border-border";
              const bgColor = isRejected ? "bg-muted/30 opacity-60" : "";

              return (
                <div key={p._id} className={`bg-card border ${borderColor} rounded-xl overflow-hidden transition-all ${bgColor}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Thumbnail */}
                    {p.image_url?.startsWith("http")
                      ? <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border/40" />
                      : <div className="w-12 h-12 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">Bild</div>
                    }

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{p.product_name || "—"}</span>
                        {p.scientific_name && <span className="text-xs text-muted-foreground italic">{p.scientific_name}</span>}
                        {p._dup && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />Möjlig dubblett
                          </Badge>
                        )}
                        {p.category && p.category !== "other" && (
                          <Badge variant="secondary" className="text-xs capitalize">{p.category}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {p.price != null && (
                          <span className="font-medium text-foreground">{Number(p.price).toFixed(0)} kr</span>
                        )}
                        {p.sale_price && parseFloat(p.sale_price) !== parseFloat(p.price) && (
                          <span className="line-through text-muted-foreground">{Number(p.sale_price).toFixed(0)} kr</span>
                        )}
                        <span>{toAvailability(p.availability) === "in_stock" ? "✓ I lager" : toAvailability(p.availability) === "out_of_stock" ? "✗ Slut" : "⚡ Begränsad"}</span>
                        {p.seller_name && <span>{p.seller_name}</span>}
                        {p.product_url?.startsWith("http") && (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" />Länk
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isApproved
                        ? <Badge className="bg-green-500 text-white text-xs">Godkänd</Badge>
                        : isRejected
                        ? <Badge variant="destructive" className="text-xs">Avvisad</Badge>
                        : <Badge variant="outline" className="text-xs">Väntar</Badge>
                      }
                      <Button
                        size="sm"
                        variant={isApproved ? "default" : "outline"}
                        className={`h-7 px-2 text-xs rounded-lg ${isApproved ? "bg-green-500 hover:bg-green-600" : ""}`}
                        onClick={() => toggle(p._id, isApproved ? null : "approve")}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={isRejected ? "destructive" : "outline"}
                        className="h-7 px-2 text-xs rounded-lg"
                        onClick={() => toggle(p._id, isRejected ? null : "reject")}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => setExpanded(isExpanded ? null : p._id)}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border/40 px-4 py-4 space-y-3">
                      {p._dup && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                          <span className="font-medium">Möjlig dubblett av:</span> {p._dup.title}
                        </div>
                      )}
                      {p.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Beskrivning</p>
                          <p className="text-sm text-foreground">{p.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {[
                          ["Vetenskapligt namn", p.scientific_name],
                          ["Kategori", p.category],
                          ["Pris", p.price ? `${p.price} SEK` : null],
                          ["Ordinarie pris", p.sale_price ? `${p.sale_price} SEK` : null],
                          ["Tillgänglighet", p.availability],
                          ["Säljare", p.seller_name],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <div key={label}>
                            <span className="text-muted-foreground">{label}: </span>
                            <span className="text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom import button */}
          <div className="flex justify-end pt-2">
            <Button onClick={importApproved} disabled={!approvedCount || importing} className="rounded-xl gap-2 px-8">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {importing ? "Importerar..." : `Importera ${approvedCount} godkända produkter`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}