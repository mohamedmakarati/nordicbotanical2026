import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function PriceHistoryChart({ productId, currentPrice, currency = "SEK" }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    base44.entities.PriceHistory.filter({ product_id: productId }, "date_checked", 60)
      .then((hist) => { setHistory(hist); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading) return (
    <div className="h-6 flex items-center">
      <div className="w-3 h-3 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!history.length) return (
    <p className="text-[10px] text-muted-foreground/60 italic">Ingen prishistorik ännu</p>
  );

  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const firstPrice = prices[0];
  const trend = currentPrice < firstPrice ? "down" : currentPrice > firstPrice ? "up" : "flat";
  const pctChange = firstPrice ? Math.round(((currentPrice - firstPrice) / firstPrice) * 100) : 0;

  const chartData = history.map((h) => ({
    date: format(new Date(h.date_checked), "d MMM", { locale: sv }),
    Pris: h.price,
  }));

  const isGoodPrice = currentPrice <= minPrice * 1.05; // within 5% of all-time low

  return (
    <div className="border-t border-border/40 pt-3 space-y-2">
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs group"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pristrend</span>
          {trend === "down" ? (
            <span className="flex items-center gap-0.5 text-primary font-medium">
              <TrendingDown className="w-3 h-3" /> {Math.abs(pctChange)}% lägre
            </span>
          ) : trend === "up" ? (
            <span className="flex items-center gap-0.5 text-destructive font-medium">
              <TrendingUp className="w-3 h-3" /> {pctChange}% högre
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-muted-foreground font-medium">
              <Minus className="w-3 h-3" /> Stabilt
            </span>
          )}
          {isGoodPrice && (
            <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1.5 py-0 rounded-md">
              Bra pris nu!
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Expandable chart */}
      {expanded && (
        <div className="space-y-2 pt-1">
          {/* Min/Max stats */}
          <div className="flex gap-3 text-[10px]">
            <span className="text-muted-foreground">Lägst: <span className="text-primary font-medium">{minPrice.toFixed(0)} {currency}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground">Högst: <span className="text-destructive font-medium">{maxPrice.toFixed(0)} {currency}</span></span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground">{history.length} datapunkter</span>
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: "11px",
                  padding: "6px 10px",
                }}
                formatter={(v) => [`${v} ${currency}`, "Pris"]}
              />
              <ReferenceLine y={minPrice} stroke="hsl(var(--primary))" strokeDasharray="4 3" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="Pris"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}