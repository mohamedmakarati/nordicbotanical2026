import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Link2, AlertTriangle, ArrowRight } from "lucide-react";

const SAMPLE_REDIRECTS = [
  { from: "/vaxter/monstera", to: "/plants/monstera", type: "301", status: "active" },
  { from: "/shop/lavendel", to: "/plants/lavendel", type: "301", status: "active" },
  { from: "/auction/old-id", to: "/auctions", type: "302", status: "active" },
];

const BROKEN_404S = [
  { url: "/plants/old-cactus-name", hits: 12, lastSeen: "2026-06-10" },
  { url: "/sellers/deleted-seller", hits: 5, lastSeen: "2026-06-09" },
  { url: "/blog/old-post-slug", hits: 3, lastSeen: "2026-06-08" },
];

export default function SeoRedirectManager() {
  const [redirects, setRedirects] = useState(SAMPLE_REDIRECTS);
  const [form, setForm] = useState({ from: "", to: "", type: "301" });
  const [tab, setTab] = useState("redirects");

  const add = () => {
    if (!form.from || !form.to) return;
    setRedirects(p => [...p, { ...form, status: "active" }]);
    setForm({ from: "", to: "", type: "301" });
  };

  const remove = (i) => setRedirects(p => p.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Omdirigeringshantering</h2>
        <p className="text-sm text-muted-foreground">Hantera 301/302-omdirigeringar och 404-fel</p>
      </div>

      <div className="flex gap-2">
        {[["redirects", "Omdirigeringar"], ["broken", "404-sidor"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${tab === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "redirects" && (
        <>
          <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-foreground text-sm">Lägg till omdirigering</h3>
            <div className="grid sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Från URL</Label>
                <Input value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} placeholder="/gamla-sidan" className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Till URL</Label>
                <Input value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} placeholder="/nya-sidan" className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Typ</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 Permanent</SelectItem>
                    <SelectItem value="302">302 Tillfällig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={add} className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Lägg till</Button>
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/30">
              <p className="text-sm font-medium text-foreground">{redirects.length} aktiva omdirigeringar</p>
            </div>
            <div className="divide-y divide-border/20">
              {redirects.map((r, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${r.type === "301" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.type}</span>
                  <span className="font-mono text-xs text-muted-foreground">{r.from}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="font-mono text-xs text-primary flex-1">{r.to}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg hover:text-red-500 shrink-0" onClick={() => remove(i)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "broken" && (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-medium text-foreground">{BROKEN_404S.length} brutna URL:er</p>
          </div>
          <div className="divide-y divide-border/20">
            {BROKEN_404S.map((b, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-mono text-xs text-red-600">{b.url}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.hits} träffar · Senast: {b.lastSeen}</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1.5"
                  onClick={() => setForm({ from: b.url, to: "/", type: "301" })}>
                  <Plus className="w-3 h-3" /> Omdirigera
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}