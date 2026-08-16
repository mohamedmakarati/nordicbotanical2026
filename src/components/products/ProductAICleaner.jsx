import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, CheckCircle, ChevronRight, RefreshCw, Wand2 } from "lucide-react";

export default function ProductAICleaner() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [results, setResults] = useState([]);
  const [applying, setApplying] = useState(new Set());
  const [applied, setApplied] = useState(new Set());
  const [customText, setCustomText] = useState("");
  const [customResult, setCustomResult] = useState(null);
  const [runningCustom, setRunningCustom] = useState(false);

  useEffect(() => {
    base44.entities.Product.list("-created_date", 100).then(prods => {
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  const runBatchClean = async () => {
    if (!products.length) return;
    setCleaning(true);
    setResults([]);

    const batch = products.slice(0, 30);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a plant product data cleaner for a Swedish marketplace.
Clean the following product titles and extract structured plant data.
For each product return: clean_title (Swedish, title-cased), plant_name (common Swedish name), scientific_name (Latin binomial), pot_size (e.g. "12 cm"), category (one of: tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, other).
Input products (JSON array): ${JSON.stringify(batch.map(p => ({ id: p.id, title: p.product_title })))}`,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                clean_title: { type: "string" },
                plant_name: { type: "string" },
                scientific_name: { type: "string" },
                pot_size: { type: "string" },
                category: { type: "string" },
              }
            }
          }
        }
      }
    });

    setResults(res.products || []);
    setCleaning(false);
  };

  const applyResult = async (r) => {
    setApplying(prev => new Set([...prev, r.id]));
    await base44.entities.Product.update(r.id, {
      product_title: r.clean_title,
      pot_size: r.pot_size || undefined,
    });
    setApplied(prev => new Set([...prev, r.id]));
    setApplying(prev => { const n = new Set(prev); n.delete(r.id); return n; });
  };

  const applyAll = async () => {
    for (const r of results.filter(r => !applied.has(r.id))) await applyResult(r);
  };

  const runCustom = async () => {
    if (!customText.trim()) return;
    setRunningCustom(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract structured plant data from this product title: "${customText}"
Return: plant_name (common Swedish), scientific_name (Latin), pot_size, category, clean_title, tags (array of strings like: "sällsynt", "inomhusväxt", "tropical").`,
      response_json_schema: {
        type: "object",
        properties: {
          clean_title: { type: "string" },
          plant_name: { type: "string" },
          scientific_name: { type: "string" },
          pot_size: { type: "string" },
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        }
      }
    });
    setCustomResult(res);
    setRunningCustom(false);
  };

  return (
    <div className="space-y-6">
      {/* Custom single test */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Testa AI-rensning</h3>
        </div>
        <Textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder="t.ex. Monstera deliciosa XL 17cm kruka"
          rows={2}
          className="rounded-xl"
        />
        <Button onClick={runCustom} disabled={runningCustom || !customText.trim()} className="gap-2">
          {runningCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analysera med AI
        </Button>
        {customResult && (
          <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Rensat namn", customResult.clean_title],
              ["Växtnamn", customResult.plant_name],
              ["Vetenskapligt", customResult.scientific_name],
              ["Krukstorlek", customResult.pot_size],
              ["Kategori", customResult.category],
            ].map(([label, val]) => val && (
              <div key={label}>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium">{val}</div>
              </div>
            ))}
            {customResult.tags?.length > 0 && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Taggar</div>
                <div className="flex flex-wrap gap-1">
                  {customResult.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch clean */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-foreground">Massrensning (upp till 30 produkter)</h3>
          </div>
          <div className="flex gap-2">
            {results.length > 0 && (
              <Button variant="outline" size="sm" onClick={applyAll} className="gap-2 rounded-xl">
                <CheckCircle className="w-4 h-4" /> Tillämpa alla
              </Button>
            )}
            <Button onClick={runBatchClean} disabled={cleaning || loading} className="gap-2 rounded-xl">
              {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {cleaning ? "Rengör..." : "Starta AI-rensning"}
            </Button>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Laddar produkter...</p>}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(r => {
              const original = products.find(p => p.id === r.id);
              const isApplied = applied.has(r.id);
              return (
                <div key={r.id} className={`rounded-xl border p-4 space-y-2 ${isApplied ? "border-green-200 bg-green-50" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">{original?.product_title}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{r.clean_title}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {r.scientific_name && <span className="italic">{r.scientific_name}</span>}
                        {r.pot_size && <Badge variant="outline" className="text-xs">{r.pot_size}</Badge>}
                        {r.category && <Badge variant="secondary" className="text-xs">{r.category}</Badge>}
                      </div>
                    </div>
                    {isApplied
                      ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      : <Button size="sm" variant="outline" className="rounded-lg shrink-0" onClick={() => applyResult(r)} disabled={applying.has(r.id)}>
                          {applying.has(r.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Tillämpa"}
                        </Button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}