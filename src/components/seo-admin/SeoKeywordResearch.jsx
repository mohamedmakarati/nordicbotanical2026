import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles, Loader2, TrendingUp, HelpCircle, Target, List } from "lucide-react";

const KW_TYPES = [
  { id: "high_volume", label: "Hög volym", icon: TrendingUp },
  { id: "long_tail", label: "Long tail", icon: Target },
  { id: "questions", label: "Frågekeywords", icon: HelpCircle },
  { id: "related", label: "Relaterade", icon: List },
];

export default function SeoKeywordResearch() {
  const [seed, setSeed] = useState("");
  const [kwType, setKwType] = useState("high_volume");
  const [language, setLanguage] = useState("sv");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState([]);

  const research = async () => {
    if (!seed) return;
    setLoading(true);
    const lang = language === "sv" ? "Swedish" : "English";

    const prompts = {
      high_volume: `Generate 20 high-volume SEO keywords in ${lang} related to "${seed}" for a Swedish plant marketplace (NordicBotanical.com). Include estimated monthly search volume. Return JSON: { "keywords": [{ "keyword": "...", "volume": 1200, "competition": "low|medium|high", "intent": "commercial|informational|transactional" }] }`,
      long_tail: `Generate 20 long-tail SEO keywords in ${lang} for "${seed}" for a Swedish plant marketplace. These should be 4-7 words, specific, low competition. Return JSON: { "keywords": [{ "keyword": "...", "volume": 200, "competition": "low|medium|high", "intent": "commercial|informational|transactional" }] }`,
      questions: `Generate 20 question-based SEO keywords in ${lang} that people search for about "${seed}" in Sweden. Start with: hur, vad, var, varför, vilken, kan man, etc. Return JSON: { "keywords": [{ "keyword": "...", "volume": 150, "competition": "low|medium|high", "intent": "informational" }] }`,
      related: `Generate 20 related SEO keywords in ${lang} for "${seed}" for a Swedish plant marketplace. Include synonyms, related topics, and seasonal variations. Return JSON: { "keywords": [{ "keyword": "...", "volume": 400, "competition": "low|medium|high", "intent": "commercial|informational|transactional" }] }`,
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[kwType],
      response_json_schema: {
        type: "object",
        properties: {
          keywords: { type: "array", items: { type: "object", properties: {
            keyword: { type: "string" },
            volume: { type: "number" },
            competition: { type: "string" },
            intent: { type: "string" }
          }}}
        }
      }
    });
    setKeywords(res?.keywords || []);
    setLoading(false);
  };

  const INTENT_COLORS = { commercial: "bg-green-100 text-green-700", informational: "bg-blue-100 text-blue-700", transactional: "bg-primary/10 text-primary" };
  const COMP_COLORS = { low: "text-green-600", medium: "text-amber-600", high: "text-red-500" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">AI Nyckelordsforskning</h2>
        <p className="text-sm text-muted-foreground">Hitta lönsamma sökord för den svenska växtmarknaden</p>
      </div>

      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Seed keyword</Label>
            <Input value={seed} onChange={e => setSeed(e.target.value)} placeholder="t.ex. monstera, lavendel, tropiska växter" onKeyDown={e => e.key === "Enter" && research()} />
          </div>
          <div className="space-y-1.5">
            <Label>Språk</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={research} disabled={loading || !seed} className="w-full rounded-xl gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Sök
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {KW_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setKwType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${kwType === t.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-border/40 text-muted-foreground hover:border-border"}`}>
                <Icon className="w-3 h-3" />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Analyserar med AI…</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30">
            <p className="text-sm font-medium text-foreground">{keywords.length} nyckelord hittade</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left text-xs text-muted-foreground font-medium px-5 py-2">Sökord</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-3 py-2">Volym/mån</th>
                  <th className="text-center text-xs text-muted-foreground font-medium px-3 py-2">Konkurrens</th>
                  <th className="text-center text-xs text-muted-foreground font-medium px-5 py-2">Intent</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-2.5 font-medium text-foreground">{kw.keyword}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{kw.volume?.toLocaleString()}</td>
                    <td className={`px-3 py-2.5 text-center text-xs font-semibold ${COMP_COLORS[kw.competition] || "text-muted-foreground"}`}>{kw.competition}</td>
                    <td className="px-5 py-2.5 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${INTENT_COLORS[kw.intent] || "bg-muted text-muted-foreground"}`}>{kw.intent}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Swedish plant keywords */}
      <div className="bg-card border border-border/40 rounded-xl p-5">
        <h3 className="font-medium text-foreground text-sm mb-3">Populära startord för NordicBotanical</h3>
        <div className="flex flex-wrap gap-2">
          {["köpa lavendel online", "billiga växter sverige", "växtauktion sverige", "monstera till salu", "olivträd köpa online", "tropiska växter sverige", "sticklingar köpa", "ovanliga växter auktion", "plantskola online", "växtbutik online sverige", "suckulenter köpa", "utomhusväxter billigt"].map(k => (
            <button key={k} onClick={() => { setSeed(k); }}
              className="px-3 py-1.5 bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-lg text-xs text-muted-foreground transition-colors border border-border/30">
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}