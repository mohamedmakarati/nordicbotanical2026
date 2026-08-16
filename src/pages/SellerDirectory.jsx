import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ExternalLink, MapPin, CheckCircle, Store, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const COUNTRY_FLAGS = { Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮", Iceland: "🇮🇸" };

export default function SellerDirectory() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.Seller.list().then((data) => {
      setSellers(data);
      setLoading(false);
    });
  }, []);

  const filtered = sellers.filter((s) =>
    s.seller_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs font-medium text-primary tracking-widest uppercase">Butikskatalog</span>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground mt-3 mb-4">Nordiska växtbutiker</h1>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Alla butiker vi jämför priser från. Klicka för att besöka butiken direkt.
              </p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Sök butik eller land..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/60 p-6 animate-pulse h-40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Inga butiker hittades.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((seller, i) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-card rounded-2xl border border-border/60 p-6 hover:shadow-lg hover:border-primary/20 transition-all"
                >
                  <Link to={`/sellers/${slugify(seller.seller_name)}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={seller.seller_name} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {seller.logo_url ? (
                        <img src={seller.logo_url} alt={seller.seller_name} className="w-10 h-10 object-contain rounded-lg" />
                      ) : (
                        <Store className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    {seller.verified_status && (
                      <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verifierad
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-lg text-foreground mb-1">{seller.seller_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin className="w-3 h-3" />
                    {COUNTRY_FLAGS[seller.country] || ""} {seller.country}
                  </div>
                  {seller.affiliate_program && (
                    <Badge variant="secondary" className="text-xs rounded-md mb-3">Affiliate</Badge>
                  )}
                  <a
                    href={seller.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-auto"
                  >
                    Besök butik <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-16 bg-card rounded-2xl border border-border/60 p-8 text-center">
            <Store className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-display text-xl text-foreground mb-2">Är din butik med?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vi hjälper gärna nordiska växtbutiker att synas på NordicBotanical.com. Kontakta oss för att komma med.
            </p>
            <a
              href="mailto:info@nordicbotanical.com"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Kontakta oss
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}