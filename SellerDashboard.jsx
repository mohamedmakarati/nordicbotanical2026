import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gavel, Plus, TrendingUp, Eye, Heart, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  draft: { label: "Utkast", color: "bg-gray-100 text-gray-700", icon: Clock },
  pending_approval: { label: "Väntar", color: "bg-amber-100 text-amber-700", icon: Clock },
  active: { label: "Aktiv", color: "bg-green-100 text-green-700", icon: CheckCircle },
  ended: { label: "Avslutad", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  sold: { label: "Såld", color: "bg-primary/10 text-primary", icon: CheckCircle },
  cancelled: { label: "Avbruten", color: "bg-red-100 text-red-700", icon: XCircle }
};

export default function SellerDashboard() {
  const [auctions, setAuctions] = useState([]);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); loadAuctions(u.id); }).catch(() => {});
  }, []);

  const loadAuctions = async (uid) => {
    setLoading(true);
    const data = await base44.entities.Auction.filter({ seller_id: uid }, "-created_date", 100);
    setAuctions(data);
    setLoading(false);
  };

  const stats = {
    active: auctions.filter(a => a.status === "active").length,
    sold: auctions.filter(a => a.status === "sold").length,
    total_views: auctions.reduce((s, a) => s + (a.views || 0), 0),
    total_bids: auctions.reduce((s, a) => s + (a.bid_count || 0), 0)
  };

  const filtered = auctions.filter(a => {
    if (tab === "active") return ["active", "pending_approval"].includes(a.status);
    if (tab === "ended") return ["ended", "sold"].includes(a.status);
    return true;
  });

  const TABS = [["active","Aktiva"], ["ended","Avslutade"], ["all","Alla"]];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl">Säljar-dashboard</h1>
            <p className="text-sm text-muted-foreground">Hantera dina auktioner</p>
          </div>
          <Button asChild className="rounded-xl gap-2">
            <Link to="/auction/new"><Plus className="w-4 h-4" />Ny auktion</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Aktiva", value: stats.active, icon: Gavel, color: "text-primary" },
            { label: "Sålda", value: stats.sold, icon: CheckCircle, color: "text-green-600" },
            { label: "Visningar", value: stats.total_views, icon: Eye, color: "text-blue-600" },
            { label: "Bud totalt", value: stats.total_bids, icon: TrendingUp, color: "text-amber-600" },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border/50">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit mb-6">
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${tab === v ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Gavel className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Inga auktioner hittades</p>
            <Button asChild variant="outline" className="mt-4 rounded-xl"><Link to="/auction/new">Skapa din första auktion</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                  {a.image_urls?.[0] ? (
                    <img src={a.image_urls[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Gavel className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm truncate">{a.title}</h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Aktuellt bud: <strong className="text-foreground">{a.current_bid || a.starting_price} {a.currency}</strong></span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.views || 0}</span>
                      <span className="flex items-center gap-1"><Gavel className="w-3 h-3" />{a.bid_count || 0} bud</span>
                      {a.end_date && <span>Slutar: {format(new Date(a.end_date), "d MMM HH:mm")}</span>}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-xl shrink-0">
                    <Link to={`/auctions/${a.id}`}>Visa</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}