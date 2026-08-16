import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Truck, ExternalLink, Flame, TrendingDown, Leaf, Package, Check, X, Bell, Award, Clock, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlantAssistant from "@/components/assistant/PlantAssistant";

const TABS = [
  { id: "all", label: "Alla erbjudanden", icon: Flame },
  { id: "discounted", label: "Rabatter", icon: Percent },
  { id: "seeds", label: "Frön & plantor", icon: Leaf },
  { id: "clearance", label: "Utförsäljning", icon: Tag },
];

const STORES = ["Alla butiker", "Plantagen", "Blomsterlandet", "Impecta", "Wexthuset", "GardenStore", "Odla.nu"];

export default function DealsPage() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStore, setSelectedStore] = useState("Alla butiker");
  const [sortBy, setSortBy] = useState("best_discount");

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list("-last_checked", 300),
      base44.entities.Seller.list(),
    ]).then(([prods, sels]) => {
      setSellers(sels);
      const sellerMap = Object.fromEntries(sels.map((s) => [s.id, s]));
      const enriched = prods
        .filter((p) => p.price > 0)
        .map((p) => ({
          ...p,
          seller_name: sellerMap[p.seller_id]?.seller_name || "Butik",
          seller_country: sellerMap[p.seller_id]?.country || "",
          discount_pct: p.regular_price && p.regular_price > p.price
            ? Math.round(((p.regular_price - p.price) / p.regular_price) * 100)
            : 0,
          savings: p.regular_price && p.regular_price > p.price ? p.regular_price - p.price : 0,
        }));
      setProducts(enriched);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (selectedStore !== "Alla butiker" && !p.seller_name.toLowerCase().includes(selectedStore.toLowerCase())) return false;
    if (activeTab === "discounted") return p.discount_pct > 0;
    if (activeTab === "seeds") {
      const title = (p.product_title || "").toLowerCase();
      return title.includes("frö") || title.includes("seed") || title.includes("planta") || title.includes("lök");
    }
    if (activeTab === "clearance") return p.availability === "limited" || p.discount_pct >= 30;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "best_discount") return b.discount_pct - a.discount_pct;
    if (sortBy === "lowest_price") return (a.price + (a.shipping_cost || 0)) - (b.price + (b.shipping_cost || 0));
    if (sortBy === "biggest_savings") return b.savings - a.savings;
    return 0;
  });

  const topDeals = sorted.slice(0, 20);
  const totalSavings = sorted.reduce((acc, p) => acc + p.savings, 0);
  const discountedCount = products.filter((p) => p.discount_pct > 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20 border-b border-border/40 py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive rounded-full px-4 py-1.5 text-xs font-medium mb-4">
                <Flame className="w-3.5 h-3.5" /> Uppdaterat idag
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-3">
                Dagens bästa växtdeals
              </h1>
              <p className="text-muted-foreground text-base max-w-xl mx-auto mb-6">
                Prissänkningar, utförsäljningar och kampanjer från de bästa nordiska växtbutikerna — allt på ett ställe.
              </p>

              {/* Live stats */}
              {!loading && (
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="font-semibold">{discountedCount}</span>
                    <span className="text-muted-foreground">rabatterade produkter</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold">{Math.round(totalSavings).toLocaleString("sv-SE")} SEK</span>
                    <span className="text-muted-foreground">i totala besparingar</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Uppdateras dagligen</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Category tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Store + sort selectors */}
            <div className="flex gap-2 ml-auto">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="text-sm border border-border/60 rounded-xl px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {STORES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-border/60 rounded-xl px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="best_discount">Bäst rabatt</option>
                <option value="lowest_price">Lägst pris</option>
                <option value="biggest_savings">Störst besparing</option>
              </select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card border border-border/40 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : topDeals.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Inga erbjudanden just nu</h3>
              <p className="text-muted-foreground text-sm mb-4">Prova en annan kategori eller kolla igen snart.</p>
              <Button asChild variant="outline" className="rounded-xl"><Link to="/search">Sök alla växter</Link></Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{topDeals.length} erbjudanden hittade</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {topDeals.map((deal, i) => (
                  <DealCard key={deal.id} deal={deal} index={i} />
                ))}
              </div>
            </>
          )}

          {/* Price alert CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-r from-primary/10 to-accent/20 border border-primary/20 rounded-3xl p-8 text-center"
          >
            <Bell className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="font-display text-2xl text-foreground mb-2">Vill du få prisalert?</h2>
            <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
              Spara en växt i din önskelista och vi meddelar dig när priset sjunker.
            </p>
            <Button asChild className="rounded-xl gap-2">
              <Link to="/wishlist"><Bell className="w-4 h-4" /> Skapa önskelista</Link>
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
      <PlantAssistant />
    </div>
  );
}

function DealCard({ deal, index }) {
  const hasDiscount = deal.discount_pct > 0;
  const total = (deal.price || 0) + (deal.shipping_cost || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {deal.image_url ? (
          <img
            src={deal.image_url}
            alt={deal.product_title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {index === 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Award className="w-2.5 h-2.5" /> Bästa deal
            </span>
          )}
          {hasDiscount && (
            <span className="bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{deal.discount_pct}%
            </span>
          )}
          {deal.availability === "limited" && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Fåtal kvar
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 space-y-2.5">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{deal.seller_name}</p>
          <h3 className="font-display text-sm text-foreground leading-snug line-clamp-2 mt-0.5">{deal.product_title}</h3>
        </div>

        {deal.pot_size && (
          <Badge variant="outline" className="text-[10px] w-fit rounded-md px-2 py-0">Kruka {deal.pot_size}</Badge>
        )}

        {/* Price */}
        <div className="pt-2 border-t border-border/40 space-y-1 mt-auto">
          <div className="flex items-center justify-between">
            {hasDiscount ? (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs line-through">{deal.regular_price?.toFixed(0)} SEK</span>
                <span className="text-destructive font-bold text-base">{deal.price?.toFixed(0)} SEK</span>
              </div>
            ) : (
              <span className="font-display text-primary text-base">{deal.price?.toFixed(0)} SEK</span>
            )}
          </div>
          {hasDiscount && (
            <p className="text-[10px] text-primary font-medium">Du sparar {deal.savings?.toFixed(0)} SEK</p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="w-3 h-3" />
            {deal.shipping_cost === 0 ? <span className="text-primary font-medium">Gratis frakt</span> : <span>+{deal.shipping_cost} SEK frakt</span>}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={`flex items-center gap-1 ${deal.availability === "in_stock" || deal.availability === "limited" ? "text-primary" : "text-destructive"}`}>
            {deal.availability !== "out_of_stock" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {deal.availability === "in_stock" ? "I lager" : deal.availability === "limited" ? "Fåtal kvar" : "Slut"}
          </span>
        </div>

        <Button asChild size="sm" className="w-full rounded-xl text-xs h-9 gap-1.5">
          <a href={deal.product_url} target="_blank" rel="noopener noreferrer">
            Se erbjudandet <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
}