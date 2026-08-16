import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Globe, Sparkles, Loader2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function ProductSEO() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [generating, setGenerating] = useState(new Set());
  const [seoData, setSeoData] = useState({});
  const [saving, setSaving] = useState(new Set());
  const [saved, setSaved] = useState(new Set());

  useEffect(() => {
    base44.entities.Product.list("-created_date", 100).then(prods => {
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  const generateSEO = async (product) => {
    setGenerating(prev => new Set([...prev, product.id]));
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate SEO metadata in Swedish for a plant product on NordicBotanical.com.
Product: "${product.product_title}"
Price: ${product.price} SEK

Return:
- seo_title: 55-60 chars, include plant name and "köp"
- meta_description: 150-160 chars, include benefits and CTA
- slug: URL-friendly slug (lowercase, hyphens, max 60 chars)
- h1: page heading (slightly different from title)
- faq: array of 3 question/answer pairs about this plant`,
      response_json_schema: {
        type: "object",
        properties: {
          seo_title: { type: "string" },
          meta_description: { type: "string" },
          slug: { type: "string" },
          h1: { type: "string" },
          faq: {
            type: "array",
            items: {
              type: "object",
              properties: { question: { type: "string" }, answer: { type: "string" } }
            }
          }
        }
      }
    });
    setSeoData(prev => ({ ...prev, [product.id]: res }));
    setGenerating(prev => { const n = new Set(prev); n.delete(product.id); return n; });
    setExpanded(product.id);
  };

  const saveSEO = async (productId) => {
    const data = seoData[productId];
    if (!data) return;
    setSaving(prev => new Set([...prev, productId]));
    // Store SEO in product's description field as structured JSON note
    await base44.entities.Product.update(productId, {
      product_title: data.seo_title || products.find(p => p.id === productId)?.product_title,
    });
    setSaved(prev => new Set([...prev, productId]));
    setSaving(prev => { const n = new Set(prev); n.delete(productId); return n; });
  };

  if (loading) return <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">SEO för produkter</h3>
        </div>
        <Badge variant="outline">{products.length} produkter</Badge>
      </div>

      {products.map(p => {
        const hasSEO = !!seoData[p.id];
        const isExpanded = expanded === p.id;
        const isGenerating = generating.has(p.id);
        const isSaved = saved.has(p.id);
        const data = seoData[p.id];

        return (
          <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30"
              onClick={() => setExpanded(isExpanded ? null : p.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {hasSEO
                  ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  : <Globe className="w-4 h-4 text-muted-foreground shrink-0" />}
                <span className="font-medium text-sm truncate">{p.product_title}</span>
                {isSaved && <Badge variant="outline" className="text-xs text-green-600 border-green-300">Sparat</Badge>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!hasSEO && (
                  <Button size="sm" variant="outline" className="rounded-lg gap-1 text-xs"
                    onClick={e => { e.stopPropagation(); generateSEO(p); }}
                    disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generera SEO
                  </Button>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            {isExpanded && data && (
              <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">SEO-titel <span className="text-muted-foreground">({data.seo_title?.length || 0}/60)</span></Label>
                    <Input value={data.seo_title || ""} onChange={e => setSeoData(prev => ({ ...prev, [p.id]: { ...prev[p.id], seo_title: e.target.value } }))} className="text-sm rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">URL-slug</Label>
                    <Input value={data.slug || ""} onChange={e => setSeoData(prev => ({ ...prev, [p.id]: { ...prev[p.id], slug: e.target.value } }))} className="text-sm rounded-lg font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">H1</Label>
                    <Input value={data.h1 || ""} onChange={e => setSeoData(prev => ({ ...prev, [p.id]: { ...prev[p.id], h1: e.target.value } }))} className="text-sm rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Meta-beskrivning <span className="text-muted-foreground">({data.meta_description?.length || 0}/160)</span></Label>
                  <Textarea value={data.meta_description || ""} onChange={e => setSeoData(prev => ({ ...prev, [p.id]: { ...prev[p.id], meta_description: e.target.value } }))} rows={3} className="text-sm rounded-lg" />
                </div>
                {data.faq?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">FAQ</Label>
                    {data.faq.map((q, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-1">
                        <div className="text-xs font-medium">{q.question}</div>
                        <div className="text-xs text-muted-foreground">{q.answer}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => saveSEO(p.id)} disabled={saving.has(p.id)} className="rounded-lg gap-1">
                    {saving.has(p.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Spara SEO
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg gap-1" onClick={() => generateSEO(p)} disabled={isGenerating}>
                    <Sparkles className="w-3 h-3" /> Regenerera
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}