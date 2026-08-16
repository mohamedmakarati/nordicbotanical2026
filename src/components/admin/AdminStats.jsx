import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Store, TrendingDown, Bell } from "lucide-react";

export default function AdminStats() {
  const [stats, setStats] = useState({ products: 0, sellers: 0, alerts: 0, discounted: 0 });

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list(),
      base44.entities.Seller.list(),
      base44.entities.PriceAlert.list(),
    ]).then(([products, sellers, alerts]) => {
      const discounted = products.filter((p) => p.regular_price && p.regular_price > p.price).length;
      setStats({ products: products.length, sellers: sellers.length, alerts: alerts.length, discounted });
    });
  }, []);

  const items = [
    { label: "Produkter", value: stats.products, icon: Package, color: "text-primary bg-primary/10" },
    { label: "Butiker", value: stats.sellers, icon: Store, color: "text-blue-600 bg-blue-50" },
    { label: "Rabatterade", value: stats.discounted, icon: TrendingDown, color: "text-destructive bg-destructive/10" },
    { label: "Prisbevakning", value: stats.alerts, icon: Bell, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card rounded-2xl border border-border/60 p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
            <item.icon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display text-2xl text-foreground">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}