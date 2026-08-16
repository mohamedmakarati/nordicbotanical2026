import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, MousePointerClick, Eye, BarChart2, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-border/60 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value?.toLocaleString('sv-SE') ?? '—'}</p>
      </div>
    </div>
  );
}

export default function SearchConsoleDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('searchConsoleSync', {});
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Compute totals from daily trend
  const totals = data?.daily_trend?.reduce(
    (acc, row) => ({
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
    }),
    { clicks: 0, impressions: 0 }
  ) || { clicks: 0, impressions: 0 };

  const avgCtr = data?.top_queries?.length
    ? (data.top_queries.reduce((a, r) => a + (r.ctr || 0), 0) / data.top_queries.length * 100).toFixed(1)
    : null;

  const avgPos = data?.top_queries?.length
    ? (data.top_queries.reduce((a, r) => a + (r.position || 0), 0) / data.top_queries.length).toFixed(1)
    : null;

  const chartData = data?.daily_trend?.map(row => ({
    date: row.keys?.[0]?.slice(5), // MM-DD
    Klick: row.clicks,
    Visningar: row.impressions,
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Synkar Search Console...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive font-medium mb-2">{error}</p>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Försök igen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground text-lg">Google Search Console</h2>
          {data?.site_url && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              {data.site_url}
              <ExternalLink className="w-3 h-3" />
            </p>
          )}
          {data?.date_range && (
            <p className="text-xs text-muted-foreground">{data.date_range.start} → {data.date_range.end}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5" /> Synka nu
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={MousePointerClick} label="Klick (28d)" value={totals.clicks} color="bg-primary/10 text-primary" />
        <StatCard icon={Eye} label="Visningar (28d)" value={totals.impressions} color="bg-blue-100 text-blue-600" />
        <StatCard icon={TrendingUp} label="Snitt CTR" value={avgCtr ? `${avgCtr}%` : null} color="bg-green-100 text-green-600" />
        <StatCard icon={BarChart2} label="Snitt position" value={avgPos} color="bg-orange-100 text-orange-600" />
      </div>

      {/* Trend chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-border/60 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Klick & Visningar – senaste 28 dagarna</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Klick" stroke="hsl(152,45%,28%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Visningar" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top queries */}
        <div className="bg-white rounded-xl border border-border/60 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top 25 sökfrågor</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {data?.top_queries?.map((row, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <span className="text-sm text-foreground flex-1 truncate">{row.keys?.[0]}</span>
                <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="text-foreground font-medium">{row.clicks} klick</span>
                  <span>pos {row.position?.toFixed(1)}</span>
                  <span>{(row.ctr * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top pages */}
        <div className="bg-white rounded-xl border border-border/60 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top 10 sidor</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {data?.top_pages?.map((row, i) => {
              const page = row.keys?.[0] || "";
              const path = page.replace(/^https?:\/\/[^/]+/, "") || "/";
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <a href={page} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex-1 truncate flex items-center gap-1">
                    {path} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="text-foreground font-medium">{row.clicks} klick</span>
                    <span>{row.impressions} vis</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {data?.synced_at && (
        <p className="text-xs text-muted-foreground text-right">
          Senast synkad: {new Date(data.synced_at).toLocaleString('sv-SE')}
        </p>
      )}
    </div>
  );
}