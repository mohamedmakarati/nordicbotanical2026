import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, CheckCheck, Loader2, FileText, Tag, HelpCircle, Code2, Globe } from "lucide-react";

const GENERATION_TYPES = [
  { id: "meta", label: "Meta titel & beskrivning", icon: Tag },
  { id: "headings", label: "H1 & H2 rubriker", icon: FileText },
  { id: "faq", label: "FAQ-sektion", icon: HelpCircle },
  { id: "schema", label: "Schema markup", icon: Code2 },
  { id: "plant_desc", label: "Växtbeskrivning", icon: Globe },
  { id: "category_desc", label: "Kategoribeskrivning", icon: FileText },
  { id: "internal_links", label: "Intern länkningsplan", icon: Globe },
];

const PAGE_TYPES = [
  { v: "plant", l: "Växtsida (/plants/{slug})" },
  { v: "auction", l: "Auktionssida (/auctions/{id})" },
  { v: "seller", l: "Säljaresida (/sellers/{slug})" },
  { v: "category", l: "Kategorisida (/category/{slug})" },
  { v: "blog", l: "Bloggpost (/blog/{slug})" },
  { v: "guide", l: "Guide (/guide/{slug})" },
  { v: "city", l: "Stadsida (/city/{city})" },
];

export default function SeoAIGenerator() {
  const [genType, setGenType] = useState("meta");
  const [pageType, setPageType] = useState("plant");
  const [keyword, setKeyword] = useState("");
  const [language, setLanguage] = useState("sv");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!keyword) return;
    setLoading(true);
    setResult(null);

    const lang = language === "sv" ? "Swedish" : "English";

    const prompts = {
      meta: `Generate an SEO-optimized meta title (max 60 chars) and meta description (max 155 chars) in ${lang} for a ${pageType} page about "${keyword}" on NordicBotanical.com, a Swedish plant marketplace. Return JSON: { "meta_title": "...", "meta_description": "..." }`,
      headings: `Generate an H1 heading and 4 H2 subheadings in ${lang} for a ${pageType} page about "${keyword}" on NordicBotanical.com. Make them SEO-friendly and natural. Return JSON: { "h1": "...", "h2s": ["...", "...", "...", "..."] }`,
      faq: `Generate 5 FAQ questions and answers in ${lang} for "${keyword}" on NordicBotanical.com (Swedish plant marketplace). Focus on common buyer/seller questions. Return JSON: { "faqs": [{ "question": "...", "answer": "..." }] }`,
      schema: `Generate complete JSON-LD schema markup for a ${pageType} page about "${keyword}" on NordicBotanical.com. Include appropriate schema type (Product, LocalBusiness, FAQPage, BreadcrumbList as relevant). Return JSON: { "schema": "..." (the full JSON-LD as a string) }`,
      plant_desc: `Write a compelling plant description in ${lang} for "${keyword}" for NordicBotanical.com. Include care tips, growing zone, light requirements. 2-3 paragraphs, SEO-optimized. Return JSON: { "description": "..." }`,
      category_desc: `Write an SEO-optimized category description in ${lang} for the plant category "${keyword}" on NordicBotanical.com. Include buying tips and why to choose from Nordic Botanical. 2 paragraphs. Return JSON: { "description": "..." }`,
      internal_links: `Suggest 8 internal links in ${lang} for a page about "${keyword}" on NordicBotanical.com. Include anchor text and suggested target URL paths. Return JSON: { "links": [{ "anchor": "...", "url": "...", "reason": "..." }] }`,
    };

    const schemas = {
      meta: { type: "object", properties: { meta_title: { type: "string" }, meta_description: { type: "string" } } },
      headings: { type: "object", properties: { h1: { type: "string" }, h2s: { type: "array", items: { type: "string" } } } },
      faq: { type: "object", properties: { faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } } } },
      schema: { type: "object", properties: { schema: { type: "string" } } },
      plant_desc: { type: "object", properties: { description: { type: "string" } } },
      category_desc: { type: "object", properties: { description: { type: "string" } } },
      internal_links: { type: "object", properties: { links: { type: "array", items: { type: "object", properties: { anchor: { type: "string" }, url: { type: "string" }, reason: { type: "string" } } } } } },
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[genType] + (extra ? `\nExtra context: ${extra}` : ""),
      response_json_schema: schemas[genType],
    });
    setResult(res);
    setLoading(false);
  };

  const copyResult = () => {
    navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderResult = () => {
    if (!result) return null;
    if (genType === "meta") return (
      <div className="space-y-3">
        <div className="space-y-1"><p className="text-xs text-muted-foreground font-medium">Meta titel ({result.meta_title?.length || 0}/60)</p><p className="text-sm bg-muted/30 rounded-lg p-2.5">{result.meta_title}</p></div>
        <div className="space-y-1"><p className="text-xs text-muted-foreground font-medium">Meta beskrivning ({result.meta_description?.length || 0}/155)</p><p className="text-sm bg-muted/30 rounded-lg p-2.5">{result.meta_description}</p></div>
      </div>
    );
    if (genType === "headings") return (
      <div className="space-y-3">
        <div><p className="text-xs text-muted-foreground font-medium mb-1">H1</p><p className="text-base font-semibold bg-primary/5 rounded-lg p-2.5">{result.h1}</p></div>
        <div><p className="text-xs text-muted-foreground font-medium mb-1">H2:or</p>
          {result.h2s?.map((h, i) => <p key={i} className="text-sm bg-muted/30 rounded-lg p-2.5 mb-1.5">{h}</p>)}
        </div>
      </div>
    );
    if (genType === "faq") return (
      <div className="space-y-3">
        {result.faqs?.map((f, i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-3">
            <p className="font-medium text-sm text-foreground mb-1">Q: {f.question}</p>
            <p className="text-sm text-muted-foreground">A: {f.answer}</p>
          </div>
        ))}
      </div>
    );
    if (genType === "internal_links") return (
      <div className="space-y-2">
        {result.links?.map((l, i) => (
          <div key={i} className="flex gap-3 items-start bg-muted/30 rounded-lg p-2.5">
            <span className="text-primary text-sm font-medium shrink-0">{l.anchor}</span>
            <span className="text-xs text-muted-foreground font-mono">{l.url}</span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0 max-w-[30%] text-right">{l.reason}</span>
          </div>
        ))}
      </div>
    );
    return <pre className="text-xs bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">AI SEO Generator</h2>
        <p className="text-sm text-muted-foreground">Generera SEO-innehåll automatiskt med AI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-foreground text-sm">Konfigurera generering</h3>

          <div className="space-y-1.5">
            <Label>Typ av innehåll</Label>
            <div className="grid grid-cols-2 gap-2">
              {GENERATION_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setGenType(t.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${genType === t.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-border/40 text-muted-foreground hover:border-border"}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sidtyp</Label>
              <Select value={pageType} onValueChange={setPageType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_TYPES.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Språk</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nyckelord / ämne *</Label>
            <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="t.ex. monstera, lavendel, växtauktion" />
          </div>

          <div className="space-y-1.5">
            <Label>Extra kontext (valfritt)</Label>
            <Textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2} placeholder="Kategori, pris, säljare…" />
          </div>

          <Button onClick={generate} disabled={loading || !keyword} className="w-full rounded-xl gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Genererar…</> : <><Sparkles className="w-4 h-4" /> Generera</>}
          </Button>
        </div>

        {/* Output panel */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground text-sm">Resultat</h3>
            {result && (
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs rounded-lg" onClick={copyResult}>
                {copied ? <><CheckCheck className="w-3 h-3 text-green-600" /> Kopierad</> : <><Copy className="w-3 h-3" /> Kopiera</>}
              </Button>
            )}
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Genererar med AI…</p>
            </div>
          ) : result ? renderResult() : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Sparkles className="w-10 h-10 opacity-20" />
              <p className="text-sm">Välj typ och klicka Generera</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}