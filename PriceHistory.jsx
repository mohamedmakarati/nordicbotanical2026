import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function PriceHistory() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("product_id");
  const [history, setHistory] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    Promise.all([
      base44.entities.PriceHistory.filter({ product_id: productId }, "date_checked", 90),
      base44.entities.Product.list(),
    ]).then(([hist, products]) => {
      setHistory(hist);
      const prod = products.find((p) => p.id === productId);
      setProduct(prod);
      setLoading(false);
    });
  }, [productId]);

  const chartData = history.map((h) => ({
    date: format(new Date(h.date_checked), "d MMM", { locale: sv }),
    Pris: h.price,
    Total: h.total_price || h.price,
  }));

  const prices = history.map((h) => h.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const latestPrice = prices[prices.length - 1] || 0;
  const firstPrice = prices[0] || 0;
  const trend = latestPrice < firstPrice ? "down" : latestPrice > firstPrice ? "up" : "flat";

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12">
        {!productId ? (
          <div className="text-center py-24">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Välj en produkt för att se prishistorik.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <span className="text-xs font-medium text-primary tracking-widest uppercase">Prishistorik</span>
              <h1 className="font-display text-3xl text-foreground mt-2">{product?.product_title || "Produkt"}</h1>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Lägsta pris", value: minPrice, icon: TrendingDown, color: "text-primary" },
                { label: "Högsta pris", value: maxPrice, icon: TrendingUp, color: "text-destructive" },
                { label: "Nuvarande", value: latestPrice, icon: Minus, color: "text-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-2xl border border-border/60 p-4 text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <div className={`font-display text-2xl ${stat.color}`}>{stat.value.toFixed(0)} kr</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl border border-border/60 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg text-foreground">Prisutveckling</h2>
                <Badge variant={trend === "down" ? "default" : trend === "up" ? "destructive" : "secondary"} className="rounded-lg">
                  {trend === "down" ? "📉 Sjunker" : trend === "up" ? "📈 Stiger" : "➡️ Stabilt"}
                </Badge>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                      formatter={(v) => [`${v} kr`]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Pris" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Total" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Ingen prishistorik tillgänglig ännu. Data samlas in dagligen.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}