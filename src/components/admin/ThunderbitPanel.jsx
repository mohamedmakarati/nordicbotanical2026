import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Play, Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";

const PRODUCT_SCHEMA = {
  type: "object",
  properties: {
    product_name:   { type: "string",  description: "product name" },
    price:          { type: "number",  description: "current sale price as a number" },
    regular_price:  { type: "number",  description: "original price before discount as a number, or null if not on sale" },
    currency:       { type: "string",  description: "3-letter currency code, e.g. SEK" },
    description:    { type: "string",  description: "short product description" },
    scientific_name:{ type: "string",  description: "latin/scientific plant name if available" },
    product_url:    { type: "string",  description: "direct URL to the product page" },
    image_url:      { type: "string",  description: "main product image URL" },
    availability:   { type: "string",  description: "in stock / out of stock / limited" },
    pot_size:       { type: "string",  description: "pot diameter or plant size, e.g. 12cm" }
  },
  required: ["product_name", "price"]
};

export default function ThunderbitPanel() {
  const [urlsText, setUrlsText] = useState("");
  const [action, setAction] = useState("extract_list_llm");
  const [renderMode, setRenderMode] = useState("basic");
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");

  useEffect(() => {
    base44.entities.Seller.list().then(setSellers).catch(() => {});
  }, []);

  const urls = urlsText.split("\n").map(u => {
    u = u.trim();
    // Strip any malformed protocol prefix and re-add https://
    u = u.replace(/^https?:\/?\/?/, "");
    if (u) u = "https://" + u;
    return u;
  }).filter(Boolean);

  const runScrape = async () => {
    if (!urls.length) return;
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: urls.length });

    const newResults = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await base44.functions.invoke("thunderbitScraper", {
          action,
          url,
          schema: action === "extract" ? PRODUCT_SCHEMA : undefined,
          renderMode,
          countryCode: "SE"
        });

        const d = res.data;
        if (d?.success === false) {
          const msg = d?.error?.message || d?.error?.code || "Okänt fel från Thunderbit";
          const code = d?.error?.status || d?.error?.code || "";
          newResults.push({ url, status: "error", error: `${code ? code + ": " : ""}${msg}`, errorCode: d?.error?.status });
        } else {
          newResults.push({ url, status: "success", data: d });
        }
      } catch (err) {
        newResults.push({ url, status: "error", error: err.message });
      }

      setProgress({ done: i + 1, total: urls.length });
      setResults([...newResults]);
    }

    setRunning(false);
  };

  const toAvailability = (str) =>
    str?.toLowerCase().includes("out") ? "out_of_stock"
    : str?.toLowerCase().includes("limited") ? "limited"
    : "in_stock";

  const mapProduct = (d, fallbackUrl) => {
    const price = parseFloat(d.price) || 0;
    const regularPrice = parseFloat(d.regular_price);
    return {
      product_title: d.product_name || fallbackUrl,
      price,
      // only set regular_price if it's a real number AND different from price
      regular_price: (regularPrice && regularPrice !== price) ? regularPrice : undefined,
      currency: d.currency || "SEK",
      product_url: d.product_url && d.product_url.startsWith("http") ? d.product_url : fallbackUrl,
      image_url: d.image_url && d.image_url.startsWith("http") ? d.image_url : undefined,
      availability: toAvailability(d.availability),
      seller_id: selectedSellerId,
      last_checked: new Date().toISOString(),
    };
  };

  const importAsProducts = async (result) => {
    if (!result.data) return;
    let raw = result.data?.data ?? result.data;
    const items = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? [raw] : []);
    try {
      if (items.length === 1) {
        await base44.entities.Product.create(mapProduct(items[0], result.url));
      } else {
        await base44.entities.Product.bulkCreate(items.map(d => mapProduct(d, result.url)));
      }
      alert(`${items.length} produkt(er) importerade!`);
    } catch (e) {
      alert("Fel: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-900" />
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">Thunderbit Scraper</h2>
          <p className="text-sm text-muted-foreground">Extrahera produktdata från webbsidor med AI</p>
        </div>
      </div>

      {/* Config */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Läge</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extract_list_llm">Kategorisida – extrahera lista med AI</SelectItem>
                <SelectItem value="extract">Enstaka produkt (JSON)</SelectItem>
                <SelectItem value="distill">Distillera (Markdown)</SelectItem>
                <SelectItem value="suggest_fields">Föreslå fält</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Renderläge</label>
            <Select value={renderMode} onValueChange={setRenderMode}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (snabb)</SelectItem>
                <SelectItem value="basic">Basic (standard)</SelectItem>
                <SelectItem value="full">Full (JS-tunga sidor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Butik (för import)</label>
          <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Välj butik..." />
            </SelectTrigger>
            <SelectContent>
              {sellers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedSellerId && <p className="text-xs text-amber-600">⚠ Välj en butik innan import</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            URLs (en per rad, max 100)
          </label>
          <Textarea
            value={urlsText}
            onChange={e => setUrlsText(e.target.value)}
            placeholder={"https://www.blomsterlandet.se/produkter/...\nhttps://www.plantagen.se/..."}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">{urls.length} URL{urls.length !== 1 ? "s" : ""} inlagda</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={runScrape} disabled={running || !urls.length} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? `Skrapar... (${progress.done}/${progress.total})` : "Starta skrapning"}
          </Button>
          {results.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setResults([])} className="gap-1 text-muted-foreground">
              <Trash2 className="w-4 h-4" /> Rensa
            </Button>
          )}
        </div>

        {running && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Resultat ({results.length})</h3>
          {results.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {r.status === "success"
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <span className="text-sm font-mono text-muted-foreground truncate">{r.url}</span>
                </div>
                <Badge variant={r.status === "success" ? "default" : "destructive"} className="shrink-0">
                  {r.status === "success" ? "OK" : "FEL"}
                </Badge>
              </div>

              {r.status === "error" && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 space-y-1">
                  <p>{r.error}</p>
                  {(r.error?.includes("503") || r.errorCode === 503) && (
                    <p className="text-xs text-muted-foreground">💡 Webbplatsen blockerar skrapning. Prova en direkt produkt-URL eller en annan webbplats.</p>
                  )}
                  {(r.error?.includes("500") || r.errorCode === 500) && (
                    <p className="text-xs text-muted-foreground">💡 Thunderbit kunde inte behandla sidan. Prova renderläge "Full" eller en mer specifik URL.</p>
                  )}
                  {(r.error?.includes("422") || r.errorCode === 422) && (
                    <p className="text-xs text-muted-foreground">💡 Webbplatsen (t.ex. Plantagen) blockerar aktivt skrapning och stöds inte. Prova Blomsterlandet eller en annan butik.</p>
                  )}
                </div>
              )}

              {r.status === "success" && r.data && (
                <>
                  {(action === "extract" || action === "extract_list" || action === "extract_list_llm") && (() => {
                    // Normalize: extract_list returns { data: [...] }, extract returns { data: {...} }
                    let raw = r.data?.data ?? r.data;
                    const items = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? [raw] : []);
                    const keys = items.length > 0 ? Object.keys(items[0]).filter(k => items.some(d => d[k])) : [];
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{items.length} produkt(er) hittade</p>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted">
                                {keys.map(k => (
                                  <th key={k} className="px-2 py-1.5 text-left font-medium text-muted-foreground capitalize whitespace-nowrap">
                                    {k.replace(/_/g, " ")}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, idx) => (
                                <tr key={idx} className="border-t border-border hover:bg-muted/50">
                                  {keys.map(k => (
                                    <td key={k} className="px-2 py-1.5 max-w-[180px] truncate text-foreground">
                                      {item[k] != null ? String(item[k]) : ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => importAsProducts(r)} disabled={!selectedSellerId} className="gap-1">
                          + Importera {items.length > 1 ? `alla ${items.length} produkter` : "som produkt"}
                        </Button>
                      </div>
                    );
                  })()}

                  {action === "distill" && (
                    <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">{r.data?.markdown || r.data?.data?.markdown || JSON.stringify(r.data, null, 2)}</pre>
                    </div>
                  )}

                  {action === "suggest_fields" && (
                    <div className="bg-muted rounded-lg p-3">
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r.data?.fields || r.data, null, 2)}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}