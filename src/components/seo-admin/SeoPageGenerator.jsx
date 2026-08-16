import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Loader2, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";

const PAGE_TEMPLATES = [
  { id: "plant", label: "Växtssida", urlPattern: "/plants/{slug}", entity: "Plant" },
  { id: "auction_plant", label: "Auktions-växtssida", urlPattern: "/auctions?plant={slug}", entity: "Auction" },
  { id: "seller", label: "Säljaresida", urlPattern: "/sellers/{slug}", entity: "Seller" },
  { id: "category", label: "Kategorisida", urlPattern: "/plants/{category}", entity: null },
  { id: "city", label: "Stadsida", urlPattern: "/guide/vaxter-{city}", entity: null },
  { id: "guide", label: "Guidesida", urlPattern: "/guide/{slug}", entity: null },
];

const SWEDISH_CITIES = ["stockholm", "goteborg", "malmo", "uppsala", "vasteras", "orebro", "linkoping", "helsingborg"];
const CATEGORIES = ["tropical", "succulent", "cactus", "fern", "orchid", "palm", "herb", "tree", "climbing", "rose"];

export default function SeoPageGenerator() {
  const [template, setTemplate] = useState("plant");
  const [keyword, setKeyword] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    base44.entities.Plant.list("-created_date", 50).then(setPlants).catch(() => {});
  }, []);

  const generateBulk = async () => {
    setGenerating(true);
    const t = PAGE_TEMPLATES.find(p => p.id === template);
    let items = [];

    if (template === "plant") items = plants.slice(0, 20).map(p => ({ name: p.plant_name, slug: p.plant_name?.toLowerCase().replace(/\s+/g, "-"), url: `/plants/${p.plant_name?.toLowerCase().replace(/\s+/g, "-")}` }));
    else if (template === "city") items = SWEDISH_CITIES.map(c => ({ name: c, slug: c, url: `/guide/vaxter-${c}` }));
    else if (template === "category") items = CATEGORIES.map(c => ({ name: c, slug: c, url: `/plants/${c}` }));
    else if (keyword) items = [{ name: keyword, slug: keyword.toLowerCase().replace(/\s+/g, "-"), url: t.urlPattern.replace("{slug}", keyword.toLowerCase().replace(/\s+/g, "-")) }];

    // Generate SEO meta for each
    const withMeta = await Promise.all(items.slice(0, 10).map(async item => {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate meta title (max 60 chars) and meta description (max 155 chars) in Swedish for a page about "${item.name}" on NordicBotanical.com (Swedish plant marketplace). Return JSON: { "meta_title": "...", "meta_description": "..." }`,
        response_json_schema: { type: "object", properties: { meta_title: { type: "string" }, meta_description: { type: "string" } } }
      }).catch(() => ({ meta_title: item.name, meta_description: "" }));
      return { ...item, ...res };
    }));

    setGenerated(withMeta);
    setGenerating(false);
  };

  const saveToDb = async (item) => {
    if (template === "guide") {
      await base44.entities.BlogPost.create({
        title: item.meta_title || item.name,
        slug: item.slug,
        excerpt: item.meta_description,
        category: "odlingstips",
        status: "draft",
      }).catch(() => {});
    }
    alert(`Sida sparad: ${item.url}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Automatisk Sidgenerator</h2>
        <p className="text-sm text-muted-foreground">Generera SEO-sidor automatiskt baserat på din data</p>
      </div>

      {/* Config */}
      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Sidmall</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nyckelord (om ej bulk)</Label>
            <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="t.ex. monstera, lavendel" />
          </div>
          <div className="flex items-end">
            <Button onClick={generateBulk} disabled={generating} className="w-full rounded-xl gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Genererar…</> : <><Sparkles className="w-4 h-4" /> Generera sidor</>}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          URL-mönster: <code className="bg-muted px-1.5 py-0.5 rounded text-primary">{PAGE_TEMPLATES.find(t => t.id === template)?.urlPattern}</code>
        </p>
      </div>

      {/* Generated pages */}
      {generated.length > 0 && (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
            <h3 className="font-medium text-foreground text-sm">{generated.length} sidor genererade</h3>
            <span className="text-xs text-muted-foreground">Klicka för att spara</span>
          </div>
          <div className="divide-y divide-border/20">
            {generated.map((page, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{page.meta_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{page.meta_description}</p>
                  <p className="text-[10px] text-primary font-mono mt-1">{page.url}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs rounded-lg" onClick={() => saveToDb(page)}>
                    <Plus className="w-3 h-3" /> Spara
                  </Button>
                  <a href={page.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg"><ExternalLink className="w-3 h-3" /></Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}