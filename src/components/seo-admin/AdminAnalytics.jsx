import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, TrendingUp, Eye, ShoppingBag, Users, Gavel, DollarSign } from "lucide-react";

const MOCK_TRAFFIC = [
  { month: "Jan", visitors: 1200, pageviews: 3800 },
  { month: "Feb", visitors: 1450, pageviews: 4200 },
  { month: "Mar", visitors: 1800, pageviews: 5100 },
  { month: "Apr", visitors: 2100, pageviews: 6300 },
  { month: "Maj", visitors: 2800, pageviews: 8200 },
  { month: "Jun", visitors: 3200, pageviews: 9100 },
];

const MOCK_REVENUE = [
  { month: "Jan", auctions: 12400, commission: 1240 },
  { month: "Feb", auctions: 15600, commission: 1560 },
  { month: "Mar", auctions: 18200, commission: 1820 },
  { month: "Apr", auctions: 22000, commission: 2200 },
  { month: "Maj", auctions: 28500, commission: 2850 },
  { month: "Jun", auctions: 32000, commission: 3200 },
];

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topSearched, setTopSearched] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [auctions, orders, sellers, users] = await Promise.all([
        base44.entities.Auction.list().catch(() => []),
        base44.entities.Order.list().catch(() => []),
        base44.entities.SellerProfile.filter({ status: "active" }).catch(() => []),
        base44.entities.User.list().catch(() => []),
      ]);
      const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const totalViews = auctions.reduce((s, a) => s + (a.views || 0), 0);
      setStats({ auctions: auctions.length, orders: orders.length, sellers: sellers.length, users: users.length, revenue: totalRevenue, views: totalViews });
      setLoading(false);
    };
    load();

    base44.functions.invoke("searchConsoleSync", {}).then(res => {
      if (res?.data?.queries) setTopSearched(res.data.queries.slice(0, 8));
    }).catch(() => {});
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Analys & statistik</h2>
        <p className="text-sm text-muted-foreground">Plattformens prestanda och intäkter</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { l: "Användare", v: stats.users, Ic: Users, c: "text-primary" },
          { l: "Aktiva säljare", v: stats.sellers, Ic: TrendingUp, c: "text-green-600" },
          { l: "Auktioner", v: stats.auctions, Ic: Gavel, c: "text-amber-600" },
          { l: "Beställningar", v: stats.orders, Ic: ShoppingBag, c: "text-blue-600" },
          { l: "Auktionsvisningar", v: stats.views.toLocaleString(), Ic: Eye, c: "text-purple-600" },
          { l: "Total omsättning", v: `${stats.revenue.toLocaleString()} kr`, Ic: DollarSign, c: "text-rose-600" },
        ].map(k => (
          <div key={k.l} className="bg-card border border-border/40 rounded-xl p-4">
            <k.Ic className={`w-4 h-4 ${k.c} mb-2`} />
            <p className="text-xl font-bold text-foreground leading-tight">{k.v}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.l}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Traffic chart */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <h3 className="font-medium text-foreground text-sm mb-4">Trafik (mockdata)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={MOCK_TRAFFIC}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="hsl(152,45%,28%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pageviews" stroke="hsl(38,40%,55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue chart */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <h3 className="font-medium text-foreground text-sm mb-4">Omsättning SEK (mockdata)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_REVENUE}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="auctions" fill="hsl(152,45%,28%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" fill="hsl(38,40%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top searched */}
      {topSearched.length > 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <h3 className="font-medium text-foreground text-sm mb-4">Topp sökord (Google Search Console)</h3>
          <div className="space-y-2">
            {topSearched.map((q, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm text-foreground">{q.query}</span>
                    <span className="text-xs text-muted-foreground">{q.clicks} klick</span>
                  </div>
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(100, (q.clicks / (topSearched[0]?.clicks || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}