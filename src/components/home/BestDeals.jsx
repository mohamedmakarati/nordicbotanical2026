import { useEffect, useState } from "react";
import { Award, Truck, ExternalLink, Tag, Package, Check, X, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function BestDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, sellers] = await Promise.all([
          base44.entities.Product.list("-created_date", 50),
          base44.entities.Seller.list(),
        ]);
        const sellerMap = Object.fromEntries(sellers.map((s) => [s.id, s]));
        // Filter to products with images and price info, prefer discounted
        const enriched = products
          .filter((p) => p.image_url && p.price)
          .map((p) => ({
            ...p,
            seller_name: sellerMap[p.seller_id]?.seller_name || "Butik",
            seller_country: sellerMap[p.seller_id]?.country || "",
          }));

        const discounted = enriched.filter((p) => p.regular_price && p.regular_price > p.price);
        const rest = enriched.filter((p) => !p.regular_price || p.regular_price <= p.price);
        const sorted = [...discounted, ...rest].slice(0, 4);
        setDeals(sorted);
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasDiscount = (d) => d.regular_price && d.regular_price > d.price;
  const discountPct = (d) => Math.round(((d.regular_price - d.price) / d.regular_price) * 100);
  const totalPrice = (d) => (d.price || 0) + (d.shipping_cost || 0);

  return (
    <section className="py-24 bg-accent/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14"
        >
          <div>
            <span className="text-xs font-medium text-primary tracking-widest uppercase">Erbjudanden</span>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-2">
              Bästa växterbjudanden idag
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg">
              Handplockade prissänkningar från nordiska växtbutiker — uppdateras dagligen
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl shrink-0 text-sm">
            <Link to="/deals">Se alla erbjudanden</Link>
          </Button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Inga erbjudanden just nu — kolla igen snart!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/40">
                  <img
                    src={deal.image_url}
                    alt={deal.product_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/30" />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {i === 0 && (
                      <Badge className="bg-primary text-primary-foreground rounded-lg text-xs px-2 py-0.5 flex items-center gap-1 shadow">
                        <Award className="w-3 h-3" /> Bästa priset
                      </Badge>
                    )}
                    {hasDiscount(deal) && (
                      <Badge className="bg-destructive text-destructive-foreground rounded-lg text-xs px-2 py-0.5 flex items-center gap-1 shadow">
                        <Tag className="w-3 h-3" /> -{discountPct(deal)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5 flex flex-col flex-1">
                  {/* Name */}
                  <div>
                    <h3 className="font-display text-sm text-foreground leading-snug line-clamp-2">{deal.product_title}</h3>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-1.5">
                    {deal.pot_size && (
                      <Badge variant="outline" className="text-[10px] rounded-md font-normal px-2 py-0.5">
                        {deal.pot_size}
                      </Badge>
                    )}
                    {deal.seller_country && (
                      <Badge variant="outline" className="text-[10px] rounded-md font-normal px-2 py-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {deal.seller_country}
                      </Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1 pt-1.5 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Pris</span>
                      <div className="flex items-center gap-2">
                        {hasDiscount(deal) && (
                          <span className="text-xs text-muted-foreground line-through">
                            {deal.regular_price?.toFixed(0)} {deal.currency || "SEK"}
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${hasDiscount(deal) ? "text-destructive" : "text-foreground"}`}>
                          {deal.price?.toFixed(0)} {deal.currency || "SEK"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Frakt
                      </span>
                      <span className="text-xs">
                        {deal.shipping_cost === 0 ? (
                          <span className="text-primary font-medium">Gratis</span>
                        ) : (
                          <span className="text-muted-foreground">{deal.shipping_cost?.toFixed(0)} {deal.currency || "SEK"}</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-border/40">
                      <span className="text-xs font-medium text-foreground">Totalt</span>
                      <span className="text-base font-display text-primary">
                        {totalPrice(deal).toFixed(0)} {deal.currency || "SEK"}
                      </span>
                    </div>
                  </div>

                  {/* Seller + availability */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium truncate max-w-[60%]">{deal.seller_name}</span>
                    <span className={`flex items-center gap-1 font-medium ${deal.availability === "in_stock" ? "text-primary" : "text-destructive"}`}>
                      {deal.availability === "in_stock" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {deal.availability === "in_stock" ? "I lager" : "Slut i lager"}
                    </span>
                  </div>

                  {/* CTA */}
                  <Button
                    asChild
                    size="sm"
                    className="w-full rounded-xl text-xs h-9 gap-1.5 mt-auto"
                  >
                    <a href={deal.product_url} target="_blank" rel="noopener noreferrer">
                      Besök butik <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}