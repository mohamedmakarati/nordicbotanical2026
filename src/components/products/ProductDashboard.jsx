import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, CheckCircle, FileText, AlertTriangle, Download, Clock, Copy, Image, Search } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-2xl font-semibold text-foreground">{value ?? "—"}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  </div>
);

export default function ProductDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const products = await base44.entities.Product.list("-created_date", 1000);
      const total = products.length;
      const inStock = products.filter(p => p.availability === "in_stock" || !p.availability).length;
      const outOfStock = products.filter(p => p.availability === "out_of_stock").length;
      const missingImage = products.filter(p => !p.image_url).length;
      const missingUrl = products.filter(p => !p.product_url).length;
      const withDiscount = products.filter(p => p.regular_price && p.regular_price > p.price).length;
      // group by title similarity for duplicate estimate
      const titles = products.map(p => p.product_title?.toLowerCase().trim());
      const dupSet = new Set();
      titles.forEach((t, i) => { if (t && titles.indexOf(t) !== i) dupSet.add(t); });
      const duplicates = products.filter(p => dupSet.has(p.product_title?.toLowerCase().trim())).length;

      setStats({ total, inStock, outOfStock, missingImage, missingUrl, withDiscount, duplicates });
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  const cards = [
    { icon: Package, label: "Totalt produkter", value: stats.total, color: "bg-primary/10 text-primary" },
    { icon: CheckCircle, label: "I lager", value: stats.inStock, color: "bg-green-100 text-green-700" },
    { icon: AlertTriangle, label: "Slut i lager", value: stats.outOfStock, color: "bg-red-100 text-red-700" },
    { icon: Copy, label: "Möjliga dubbletter", value: stats.duplicates, color: "bg-orange-100 text-orange-700" },
    { icon: Image, label: "Saknar bild", value: stats.missingImage, color: "bg-yellow-100 text-yellow-700" },
    { icon: Search, label: "Saknar URL", value: stats.missingUrl, color: "bg-blue-100 text-blue-700" },
    { icon: FileText, label: "Med rabatt", value: stats.withDiscount, color: "bg-purple-100 text-purple-700" },
    { icon: Download, label: "Kategorier", value: "—", color: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>
    </div>
  );
}