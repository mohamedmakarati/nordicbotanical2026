import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, Search, Users, Leaf, Package, Eye } from "lucide-react";

const CATEGORY_COLORS = ["#1F4D36", "#6BAF6F", "#8FBF8F", "#C4A86A", "#D49B6A", "#A0785A", "#6B8E7F", "#9CAA8A", "#B5A692", "#7A9B6E", "#A8B89A"];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    topProducts: [],
    dailySearches: [],
    activeUsers: [],
    categoryDistribution: [],
    topPlants: [],
    summary: { totalViews: 0, totalSearches: 0, activeUsersToday: 0, totalProducts: 0 },
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [products, auctions, users, priceAlerts, userPlants, bids, orders, blogs, wishlists] = await Promise.all([
        base44.entities.Product.list('-price', 200).catch(() => []),
        base44.entities.Auction.filter({ status: 'active' }, '-views', 50).catch(() => []),
        base44.entities.User.list().catch(() => []),
        base44.entities.PriceAlert.list().catch(() => []),
        base44.entities.UserPlant.list().catch(() => []),
        base44.entities.Bid.list().catch(() => []),
        base44.entities.Order.list().catch(() => []),
        base44.entities.BlogPost.filter({ status: 'published' }, '-views', 10).catch(() => []),
        base44.entities.Wishlist.list().catch(() => []),
      ]);

      // Top products by views (proxy: auctions with most views + most-watched products)
      const topAuctions = auctions
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 8)
        .map(a => ({
          name: a.title?.slice(0, 25) + (a.title?.length > 25 ? '...' : ''),
          views: a.views || 0,
          price: a.current_bid || a.starting_price || 0,
        }));

      // Top plants by user collection count
      const plantCounts = {};
      userPlants.forEach(up => {
        const name = up.plant_name || 'Okänd';
        plantCounts[name] = (plantCounts[name] || 0) + 1;
      });
      const topPlants = Object.entries(plantCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name: name.slice(0, 20), samlingar: count }));

      // Category distribution
      const catCounts = {};
      const catLabels = {
        tropical: 'Tropiska', succulent: 'Suckulenter', cactus: 'Kaktusar',
        fern: 'Ormbunkar', orchid: 'Orkidéer', palm: 'Palmer',
        herb: 'Örter', tree: 'Träd', climbing: 'Klättrande', rose: 'Rosor', other: 'Annat'
      };
      [...products, ...auctions].forEach(p => {
        const cat = p.category || 'other';
        catCounts[catLabels[cat] || cat] = (catCounts[catLabels[cat] || cat] || 0) + 1;
      });
      const categoryDistribution = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // Daily search volume (proxy: bids + orders + price alerts + wishlist activity per day, last 14 days)
      const now = new Date();
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        days.push({ date: dateStr, label, searches: 0, bids: 0, orders: 0, activity: 0 });
      }
      const allActivity = [
        ...bids.map(b => ({ date: b.bid_time || b.created_date, type: 'bid' })),
        ...orders.map(o => ({ date: o.created_date, type: 'order' })),
        ...priceAlerts.map(p => ({ date: p.created_date, type: 'search' })),
        ...wishlists.map(w => ({ date: w.created_date, type: 'search' })),
      ];
      allActivity.forEach(a => {
        if (!a.date) return;
        const dateStr = new Date(a.date).toISOString().split('T')[0];
        const day = days.find(d => d.date === dateStr);
        if (day) {
          day.activity++;
          if (a.type === 'bid') day.bids++;
          if (a.type === 'order') day.orders++;
          if (a.type === 'search') day.searches++;
        }
      });

      // Active users trend (proxy: users created in last 14 days + bid/order activity per day)
      const userTrend = [...days];
      users.forEach(u => {
        if (!u.created_date) return;
        const dateStr = new Date(u.created_date).toISOString().split('T')[0];
        const day = userTrend.find(d => d.date === dateStr);
        if (day) day.newUsers = (day.newUsers || 0) + 1;
      });
      // Cumulative active users (approximation)
      let cumulative = 0;
      userTrend.forEach(d => {
        cumulative += (d.newUsers || 0);
        d.activeUsers = cumulative + Math.floor((users.length - cumulative) / Math.max(1, days.indexOf(d) + 1));
      });

      // Blog views as "search volume" indicator
      const blogViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);

      const totalViews = auctions.reduce((s, a) => s + (a.views || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const activeUsersToday = users.filter(u => u.created_date && new Date(u.created_date).toISOString().split('T')[0] === today).length;

      setData({
        topProducts: topAuctions,
        dailySearches: days.map(d => ({ label: d.label, sökningar: d.searches, bud: d.bids, ordrar: d.orders })),
        activeUsers: userTrend.map(d => ({ label: d.label, användare: d.activeUsers || 0, nya: d.newUsers || 0 })),
        categoryDistribution,
        topPlants,
        summary: {
          totalViews,
          totalSearches: blogViews + priceAlerts.length + wishlists.length,
          activeUsersToday: activeUsersToday || users.length,
          totalProducts: products.length,
        },
      });
    } catch (e) {
      // silent
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const summaryCards = [
    { label: "Totala visningar", value: data.summary.totalViews, icon: Eye, color: "text-primary bg-primary/10" },
    { label: "Sökningar & bevakningar", value: data.summary.totalSearches, icon: Search, color: "text-blue-600 bg-blue-50" },
    { label: "Aktiva användare", value: data.summary.activeUsersToday, icon: Users, color: "text-accent bg-accent/10" },
    { label: "Produkter i katalog", value: data.summary.totalProducts, icon: Package, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="bg-card rounded-2xl border border-border/60 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-2xl text-foreground">{item.value.toLocaleString('sv-SE')}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily search & activity volume */}
      <div className="bg-card rounded-2xl border border-border/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Daglig aktivitet (14 dagar)</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.dailySearches}>
            <defs>
              <linearGradient id="colorSökningar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6BAF6F" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6BAF6F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1F4D36" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#1F4D36" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
            <Area type="monotone" dataKey="sökningar" stroke="#6BAF6F" fill="url(#colorSökningar)" strokeWidth={2} />
            <Area type="monotone" dataKey="bud" stroke="#1F4D36" fill="url(#colorBud)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active users trend */}
        <div className="bg-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg text-foreground">Aktiva användare</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.activeUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
              <Line type="monotone" dataKey="användare" stroke="#6BAF6F" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nya" stroke="#1F4D36" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="bg-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Kategorifördelning</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {data.categoryDistribution.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performing auctions */}
        <div className="bg-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Mest visade auktioner</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
              <Bar dataKey="views" fill="#6BAF6F" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top plants in collections */}
        <div className="bg-card rounded-2xl border border-border/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg text-foreground">Populäraste växter i samlingar</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topPlants} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
              <Bar dataKey="samlingar" fill="#1F4D36" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}