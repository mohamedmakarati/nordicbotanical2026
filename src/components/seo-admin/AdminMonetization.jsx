import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Percent, Star, Save, Loader2 } from "lucide-react";

export default function AdminMonetization() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    commission_percentage: 10,
    fixed_fee: 0,
    premium_listing_fee: 49,
    min_bid_increment: 10,
    max_auction_days: 30,
    auto_approve_listings: false,
    auction_marketplace_enabled: true,
  });

  useEffect(() => {
    base44.entities.AuctionSettings.filter({ key: "global" }).then(data => {
      if (data[0]) { setSettings(data[0]); setForm(f => ({ ...f, ...data[0] })); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { key: "global", ...form };
    if (settings) await base44.entities.AuctionSettings.update(settings.id, payload);
    else { const s = await base44.entities.AuctionSettings.create(payload); setSettings(s); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Intäktshantering</h2>
        <p className="text-sm text-muted-foreground">Provision, avgifter och plattformsinställningar</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Commission settings */}
        <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-foreground text-sm flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" /> Provision & avgifter
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Provision % (standard)</Label>
              <div className="relative">
                <Input type="number" value={form.commission_percentage} onChange={e => set("commission_percentage", Number(e.target.value))} min={0} max={30} step={0.5} />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fast avgift (SEK)</Label>
              <div className="relative">
                <Input type="number" value={form.fixed_fee} onChange={e => set("fixed_fee", Number(e.target.value))} min={0} />
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Premium-listningsavgift (SEK)</Label>
              <Input type="number" value={form.premium_listing_fee} onChange={e => set("premium_listing_fee", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Minsta budhöjning (SEK)</Label>
              <Input type="number" value={form.min_bid_increment} onChange={e => set("min_bid_increment", Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Platform toggles */}
        <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
          <h3 className="font-medium text-foreground text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Plattformsinställningar
          </h3>
          <div className="space-y-3">
            {[
              { k: "auction_marketplace_enabled", l: "Auktionsmarknadsplats aktiverad", d: "Stäng av för underhåll" },
              { k: "auto_approve_listings", l: "Auto-godkänn annonser", d: "Rekommenderas EJ — säkerhetsmässigt" },
            ].map(item => (
              <div key={item.k} className="flex items-center justify-between p-3 border border-border/30 rounded-xl">
                <div>
                  <Label className="font-medium">{item.l}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.d}</p>
                </div>
                <Switch checked={!!form[item.k]} onCheckedChange={v => set(item.k, v)} />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Max auktionslängd (dagar)</Label>
            <Input type="number" value={form.max_auction_days} onChange={e => set("max_auction_days", Number(e.target.value))} min={1} max={90} />
          </div>
        </div>
      </div>

      {/* Revenue summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-medium text-foreground text-sm mb-3">Intäktsmodell</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{form.commission_percentage}%</p>
            <p className="text-xs text-muted-foreground">Provision per auktion</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{form.premium_listing_fee} kr</p>
            <p className="text-xs text-muted-foreground">Premium-listning</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{form.fixed_fee} kr</p>
            <p className="text-xs text-muted-foreground">Fast avgift</p>
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="rounded-xl gap-2 px-6">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sparar…</> : <><Save className="w-4 h-4" /> Spara inställningar</>}
      </Button>
    </div>
  );
}