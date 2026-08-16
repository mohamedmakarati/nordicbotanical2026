import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  ExternalLink, MapPin, CheckCircle, Store, ChevronRight, Package, Tag, Leaf
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PlantCard from "@/components/search/PlantCard";

const COUNTRY_FLAGS = { Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮", Iceland: "🇮🇸" };

function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SellerProfile() {
  const { slug } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    base44.entities.Seller.list().then(async (sellers) => {
      const found = sellers.find((s) => slugify(s.seller_name) === slug);
      if (found) {
        setSeller(found);
        // Filter directly by seller_id to avoid the 50-item list limit
        const prods = await base44.entities.Product.filter(
          { seller_id: found.id },
          "price",
          200
        );
        const sellerProducts = prods
          .filter((p) => p.availability !== "out_of_stock")
          .sort((a, b) => (a.price || 999) - (b.price || 999))
          // Normalize field names for PlantCard
          .map((p) => ({ ...p, name: p.name || p.product_title }));
        setProducts(sellerProducts);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!seller) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Butiken hittades inte.</p>
          <Link to="/sellers" className="text-sm text-primary mt-3 inline-block hover:underline">← Alla butiker</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Hem</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/sellers" className="hover:text-foreground">Butiker</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{seller.seller_name}</span>
          </nav>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Seller header card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/60 p-8 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
                {seller.logo_url ? (
                  <img src={seller.logo_url} alt={seller.seller_name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Store className="w-10 h-10 text-primary/50" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-display text-3xl sm:text-4xl text-foreground">{seller.seller_name}</h1>
                  {seller.verified_status && (
                    <Badge className="bg-primary/10 text-primary border-0 rounded-lg flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verifierad butik
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {COUNTRY_FLAGS[seller.country] || ""} {seller.country}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {products.length} produkter i lager
                  </span>
                  {seller.affiliate_program && (
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Affiliateprogram
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <a
                href={seller.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
              >
                Besök butiken <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>

          {/* Products */}
          <h2 className="font-display text-2xl text-foreground mb-5">Produkter i lager</h2>
          {products.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
              <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Inga produkter i lager just nu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p, i) => (
                <PlantCard key={p.id} plant={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}