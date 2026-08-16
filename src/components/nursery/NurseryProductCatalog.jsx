import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, ExternalLink, Tag, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NurseryProductCatalog({ nurseryId, sellerId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    base44.entities.Product.filter({ seller_id: sellerId })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [sellerId]);

  const filtered = products.filter(p =>
    !search || p.product_title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="h-24 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  if (!sellerId || products.length === 0) return (
    <div className="text-center py-20">
      <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">Inga produkter i katalogen ännu.</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Produkter visas automatiskt när butikens sortiment är indexerat.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök produkter..." className="pl-9 rounded-xl" />
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} produkter</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product, i) => {
          const hasDiscount = product.regular_price && product.regular_price > product.price;
          const discountPct = hasDiscount ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100) : 0;
          return (
            <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl border border-border/60 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.product_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Leaf className="w-8 h-8 text-muted-foreground/20" /></div>
                )}
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    -{discountPct}%
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-foreground leading-tight line-clamp-2 mb-2">{product.product_title}</p>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {hasDiscount && <p className="text-[10px] text-muted-foreground line-through">{product.regular_price} {product.currency}</p>}
                    <p className="text-sm font-display text-primary">{product.price} {product.currency || "SEK"}</p>
                  </div>
                  <Badge variant={product.availability === "in_stock" ? "secondary" : "outline"} className="text-[9px] px-1.5">
                    {product.availability === "in_stock" ? "I lager" : "Slut"}
                  </Badge>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full rounded-xl h-7 text-xs gap-1.5">
                  <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                    Köp <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}