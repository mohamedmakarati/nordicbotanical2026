import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, CheckCircle2, Loader2, ChevronDown, ChevronUp, Tag } from "lucide-react";

const CATEGORIES = [
  { id: "tropical", label: "Tropiska växter", emoji: "🌴", urlPath: "/plants/tropical" },
  { id: "succulent", label: "Suckulenter", emoji: "🪴", urlPath: "/plants/succulent" },
  { id: "cactus", label: "Kaktusar", emoji: "🌵", urlPath: "/plants/cactus" },
  { id: "fern", label: "Ormbunkar", emoji: "🌿", urlPath: "/plants/fern" },
  { id: "orchid", label: "Orkidéer", emoji: "🌸", urlPath: "/plants/orchid" },
  { id: "palm", label: "Palmer", emoji: "🌴", urlPath: "/plants/palm" },
  { id: "herb", label: "Örter & Kryddor", emoji: "🌱", urlPath: "/plants/herb" },
  { id: "tree", label: "Träd & Buskar", emoji: "🌳", urlPath: "/plants/tree" },
  { id: "climbing", label: "Klätterväxter", emoji: "🪴", urlPath: "/plants/climbing" },
  { id: "rose", label: "Rosor", emoji: "🌹", urlPath: "/plants/rose" },
  { id: "other", label: "Övriga växter", emoji: "🌾", urlPath: "/plants/other" },
];

const DEFAULT_META = {
  meta_title: "",
  meta_description: "",
  keywords: "",
  h1: "",
  intro_text: "",
};

export default function SeoCategoryManager() {
  const [metas, setMetas] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [generating, setGenerating] = useState({});
  const [expanded, setExpanded] = useState({});
  const [existing, setExisting] = useState([]);

  useEffect(() => {
    base44.entities.AppSettings.filter({ key: { $regex: "^seo_category_" } })
      .then(items => {
        setExisting(items);
        const loaded = {};
        items.forEach(item => {
          try {
            const catId = item.key.replace("seo_category_", "");
            loaded[catId] = JSON.parse(item.value);
          } catch {}
        });
        setMetas(loaded);
      })
      .catch(() => {});
  }, []);

  const get = (catId) => metas[catId] || { ...DEFAULT_META };
  const set = (catId, field, value) => setMetas(prev => ({
    ...prev,
    [catId]: { ...get(catId), [field]: value }
  }));

  const save = async (catId) => {
    setSaving(prev => ({ ...prev, [catId]: true }));
    const key = `seo_category_${catId}`;
    const value = JSON.stringify(get(catId));
    const cat = CATEGORIES.find(c => c.id === catId);
    const ex = existing.find(e => e.key === key);
    if (ex) {
      await base44.entities.AppSettings.update(ex.id, { value });
    } else {
      const newItem = await base44.entities.AppSettings.create({ key, value, label: `SEO: ${cat.label}` });
      setExisting(prev => [...prev, newItem]);
    }
    setSaving(prev => ({ ...prev, [catId]: false }));
    setSaved(prev => ({ ...prev, [catId]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [catId]: false })), 2500);
  };

  const generateAI = async (catId) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    setGenerating(prev => ({ ...prev, [catId]: true }));
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Du är en SEO-expert för NordicBotanical.com, en svensk växtmarknadsplats för auktioner och köp/sälj av växter.

Skriv följande på SVENSKA för kategorin "${cat.label}" (URL: ${cat.urlPath}):
1. meta_title: max 60 tecken, innehåller nyckelord + "Nordic Botanical" eller "Sverige"
2. meta_description: max 155 tecken, säljande beskrivning med CTA
3. keywords: 8–10 svenska söknyckelord, kommaseparerade
4. h1: rubrik för sidan (max 60 tecken)
5. intro_text: 2–3 meningar introduktionstext till kategorisidan

Returnera JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          meta_title: { type: "string" },
          meta_description: { type: "string" },
          keywords: { type: "string" },
          h1: { type: "string" },
          intro_text: { type: "string" },
        }
      }
    }).catch(() => null);

    if (res) {
      setMetas(prev => ({ ...prev, [catId]: res }));
    }
    setGenerating(prev => ({ ...prev, [catId]: false }));
    setExpanded(prev => ({ ...prev, [catId]: true }));
  };

  const toggle = (catId) => setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }));
  const hasData = (catId) => Object.values(get(catId)).some(v => v);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Kategori SEO</h2>
        <p className="text-sm text-muted-foreground">Redigera metatitlar, metabeskrivningar och nyckelord för alla växtkategorier på svenska.</p>
      </div>

      <div className="bg-accent/30 border border-border/40 rounded-xl p-4 text-sm text-muted-foreground flex gap-3">
        <Tag className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Tips</p>
          <p>Använd "AI-generera" för att snabbt fylla i SEO-data, granska sedan och justera. Spara varje kategori separat.</p>
        </div>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const data = get(cat.id);
          const isExpanded = expanded[cat.id];
          const isGenerating = generating[cat.id];
          const isSaving = saving[cat.id];
          const isSaved = saved[cat.id];
          const filled = hasData(cat.id);

          return (
            <div key={cat.id} className="bg-card border border-border/40 rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">{cat.label}</p>
                    {filled && <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/30">Ifylld</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{cat.urlPath}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg"
                    onClick={() => generateAI(cat.id)} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI-generera
                  </Button>
                  <button onClick={() => toggle(cat.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="border-t border-border/30 px-5 py-4 space-y-4 bg-muted/10">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Metatitel (max 60 tecken)</Label>
                        <span className={`text-[10px] ${data.meta_title?.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                          {data.meta_title?.length || 0}/60
                        </span>
                      </div>
                      <Input value={data.meta_title} onChange={e => set(cat.id, "meta_title", e.target.value)}
                        placeholder={`${cat.label} – Köp & Sälj på Nordic Botanical`} className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">H1-rubrik</Label>
                        <span className={`text-[10px] ${data.h1?.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                          {data.h1?.length || 0}/60
                        </span>
                      </div>
                      <Input value={data.h1} onChange={e => set(cat.id, "h1", e.target.value)}
                        placeholder={`Köp ${cat.label} online`} className="text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Metabeskrivning (max 155 tecken)</Label>
                      <span className={`text-[10px] ${data.meta_description?.length > 155 ? "text-destructive" : "text-muted-foreground"}`}>
                        {data.meta_description?.length || 0}/155
                      </span>
                    </div>
                    <Textarea value={data.meta_description} onChange={e => set(cat.id, "meta_description", e.target.value)}
                      placeholder="Beskrivning som syns i Google-sökresultat…" rows={2} className="text-sm resize-none" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Nyckelord (kommaseparerade)</Label>
                    <Input value={data.keywords} onChange={e => set(cat.id, "keywords", e.target.value)}
                      placeholder="tropiska växter, köpa tropiska växter, monstera, philodendron…" className="text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Introduktionstext (visas på kategorisidan)</Label>
                    <Textarea value={data.intro_text} onChange={e => set(cat.id, "intro_text", e.target.value)}
                      placeholder="Kortfattad introduktion till kategorin…" rows={3} className="text-sm resize-none" />
                  </div>

                  {/* Google preview */}
                  {(data.meta_title || data.meta_description) && (
                    <div className="bg-white border border-border/40 rounded-xl p-4">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Google-förhandsvisning</p>
                      <p className="text-blue-600 text-sm font-medium leading-tight hover:underline cursor-pointer">
                        {data.meta_title || `${cat.label} – Nordic Botanical`}
                      </p>
                      <p className="text-green-700 text-xs mt-0.5">nordicbotanical.com{cat.urlPath}</p>
                      <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                        {data.meta_description || "Ingen metabeskrivning angiven."}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => save(cat.id)} disabled={isSaving}>
                      {isSaved ? <><CheckCircle2 className="w-3 h-3" /> Sparad!</> :
                        isSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Sparar…</> :
                        <><Save className="w-3 h-3" /> Spara</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}