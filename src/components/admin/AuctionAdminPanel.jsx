import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Trash2, Star, BarChart2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  pending_approval: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  ended: "bg-blue-100 text-blue-700",
  sold: "bg-primary/10 text-primary",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-700"
};

export default function AuctionAdminPanel() {
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState("pending_approval");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ commission_percentage: 10, auto_approve_listings: false, min_bid_increment: 10, max_auction_days: 30, premium_listing_fee: 49 });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadAuctions();
    loadSettings();
  }, [filter]);

  const loadAuctions = async () => {
    setLoading(true);
    const q = filter === "all" ? {} : { status: filter };
    const data = await base44.entities.Auction.filter(q, "-created_date", 50);
    setAuctions(data);
    setLoading(false);
  };

  const loadSettings = async () => {
    const s = await base44.entities.AuctionSettings.filter({ key: "global" });
    if (s[0]) setSettings(prev => ({ ...prev, ...s[0] }));
  };

  const approve = async (id) => {
    await base44.entities.Auction.update(id, { status: "active" });
    loadAuctions();
  };
  const reject = async (id) => {
    await base44.entities.Auction.update(id, { status: "cancelled" });
    loadAuctions();
  };
  const feature = async (a) => {
    await base44.entities.Auction.update(a.id, { featured: !a.featured });
    loadAuctions();
  };
  const remove = async (id) => {
    if (!confirm("Ta bort auktionen?")) return;
    await base44.entities.Auction.delete(id);
    loadAuctions();
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const existing = await base44.entities.AuctionSettings.filter({ key: "global" });
    if (existing[0]) await base44.entities.AuctionSettings.update(existing[0].id, settings);
    else await base44.entities.AuctionSettings.create({ ...settings, key: "global" });
    setSavingSettings(false);
  };

  const TABS = [["pending_approval","Väntar"],["active","Aktiva"],["ended","Avslutade"],["all","Alla"]];

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="p-5 rounded-2xl bg-card border border-border/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Auktionsinställningar</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            ["Provision (%)", "commission_percentage", "number"],
            ["Minimibud-ökning", "min_bid_increment", "number"],
            ["Max auktionsdagar", "max_auction_days", "number"],
            ["Premium-listningsavgift", "premium_listing_fee", "number"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <input type={type} className="mt-1 w-full h-9 px-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none" value={settings[key] || ""} onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))} />
            </div>
          ))}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input type="checkbox" checked={settings.auto_approve_listings} onChange={e => setSettings(s => ({ ...s, auto_approve_listings: e.target.checked }))} className="rounded" />
              <span className="text-sm">Auto-godkänn</span>
            </label>
          </div>
        </div>
        <Button className="mt-4 rounded-xl" onClick={saveSettings} disabled={savingSettings}>{savingSettings ? "Sparar…" : "Spara inställningar"}</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === v ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      {/* Auction list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : auctions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Inga auktioner</p>
      ) : (
        <div className="space-y-3">
          {auctions.map(a => (
            <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50">
              {a.image_urls?.[0] ? (
                <img src={a.image_urls[0]} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : <div className="w-14 h-14 rounded-xl bg-muted shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm truncate">{a.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || ""}`}>{a.status}</span>
                  {a.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Utvald</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.seller_name} · {a.current_bid || a.starting_price} {a.currency} · {a.bid_count || 0} bud</p>
                {a.end_date && <p className="text-xs text-muted-foreground">Slutar: {format(new Date(a.end_date), "d MMM yyyy HH:mm")}</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {a.status === "pending_approval" && (
                  <>
                    <Button size="sm" className="rounded-xl h-8 px-3 bg-green-600 hover:bg-green-700 gap-1" onClick={() => approve(a.id)}><CheckCircle className="w-3.5 h-3.5" />Godkänn</Button>
                    <Button size="sm" variant="outline" className="rounded-xl h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => reject(a.id)}><XCircle className="w-3.5 h-3.5" />Neka</Button>
                  </>
                )}
                <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0" onClick={() => feature(a)}><Star className={`w-3.5 h-3.5 ${a.featured ? "fill-amber-500 text-amber-500" : ""}`} /></Button>
                <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => remove(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}