import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlantAssistant from "@/components/assistant/PlantAssistant";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Leaf, ExternalLink, Truck, Check, X, Package, Store, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SORT_OPTIONS = [
  { id: "popular", label: "Populärt" },
  { id: "lowest_price", label: "Lägst pris" },
  { id: "highest_price", label: "Högst pris" },
  { id: "newest", label: "Nyast" },
];

const PAGE_SIZE = 480;

export default function PlantagenCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("getPlantagenCatalog", {});
        const data = res.data || res;
        const enriched = (data.products || []).map((p) => ({
          ...p,
          seller_name: "Plantagen",
          discount_pct: p.regular_price && p.regular_price > p.price
            ? Math.round(((p.regular_price - p.price) / p.regular_price) * 100)
            : 0,
        }));
        if (!cancelled) {
          setProducts(enriched);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const counts = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ key, count }));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (onlyAvailable && p.availability === "out_of_stock") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!(p.product_title || "").toLowerCase().includes(q) && !(p.article_number || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "lowest_price") return (a.price + (a.shipping_cost || 0)) - (b.price + (b.shipping_cost || 0));
      if (sortBy === "highest_price") return (b.price + (b.shipping_cost || 0)) - (a.price + (a.shipping_cost || 0));
      if (sortBy === "newest") return new Date(b.created_date) - new Date(a.created_date);
      return 0;
    });
    return list;
  }, [products, activeCategory, onlyAvailable, search, sortBy]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20 border-b border-border/40 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-medium mb-4">
                <Store className="w-3.5 h-3.5" /> Plantagen sortiment
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-3">
                Hela Plantagens sortiment på ett ställe
              </h1>
              <p className="text-muted-foreground text-base max-w-xl mx-auto mb-6">
                Bläddra bland hela Plantagen-katalogen — sök, filtrera per kategori och jämför priser direkt.
              </p>
              {!loading && (
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{products.length.toLocaleString("sv-SE")}</span>
                    <span className="text-muted-foreground">produkter</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Leaf className="w-4 h-4 text-accent" />
                    <span className="font-semibold">{categories.length}</span>
                    <span className="text-muted-foreground">kategorier</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                placeholder="Sök i Plantagens sortiment (namn eller artikelnummer)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-border/60 rounded-xl px-3 py-2.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <button
                onClick={() => setOnlyAvailable(!onlyAvailable)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  onlyAvailable ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> I lager
              </button>
            </div>
          </div>

          {/* Category chips */}
          {!loading && categories.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-6">
              <button
                onClick={() => { setActiveCategory("all"); setVisibleCount(PAGE_SIZE); }}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                Alla ({products.length.toLocaleString("sv-SE")})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setActiveCategory(cat.key); setVisibleCount(PAGE_SIZE); }}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                    activeCategory === cat.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {cat.key} ({cat.count})
                </button>
              ))}
            </div>
          )}

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
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">Inga produkter hittades</h3>
              <p className="text-muted-foreground text-sm mb-4">Prova en annan kategori eller sökterm.</p>
              <Button asChild variant="outline" className="rounded-xl"><Link to="/search">Sök alla växter</Link></Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filtered.length.toLocaleString("sv-SE")} produkter
                {filtered.length > visible.length && ` — visar ${visible.length.toLocaleString("sv-SE")}`}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {visible.map((product, i) => (
                  <CatalogCard key={product.id} product={product} index={i} />
                ))}
              </div>
              {filtered.length > visible.length && (
                <div className="text-center mt-8">
                  <Button variant="outline" className="rounded-xl" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                    Visa fler ({(filtered.length - visible.length).toLocaleString("sv-SE")})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <PlantAssistant />
    </div>
  );
}

function CatalogCard({ product, index }) {
  const hasDiscount = product.discount_pct > 0;
  const hasUrl = product.product_url && product.product_url.startsWith("http");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{product.discount_pct}%
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 space-y-2.5">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{product.category}</p>
          <h3 className="font-display text-sm text-foreground leading-snug line-clamp-2 mt-0.5">{product.product_title}</h3>
        </div>

        {product.article_number && (
          <p className="text-[10px] text-muted-foreground/70">Art. {product.article_number}</p>
        )}

        <div className="pt-2 border-t border-border/40 space-y-1 mt-auto">
          <div className="flex items-center justify-between">
            {hasDiscount ? (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs line-through">{product.regular_price?.toFixed(0)} SEK</span>
                <span className="text-destructive font-bold text-base">{product.price?.toFixed(0)} SEK</span>
              </div>
            ) : (
              <span className="font-display text-primary text-base">{product.price?.toFixed(0)} SEK</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Truck className="w-3 h-3" />
            {product.shipping_cost === 0 ? <span className="text-primary font-medium">Gratis frakt</span> : <span>+{product.shipping_cost} SEK frakt</span>}
          </div>
        </div>

        {hasUrl ? (
          <Button asChild size="sm" className="w-full rounded-xl text-xs h-9 gap-1.5">
            <a href={product.product_url} target="_blank" rel="noopener noreferrer">
              Se på Plantagen <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        ) : (
          <div className="w-full text-center text-xs text-muted-foreground py-1.5 border-t border-border/40">
            Tillgänglig på Plantagen
          </div>
        )}
      </div>
    </motion.div>
  );
}