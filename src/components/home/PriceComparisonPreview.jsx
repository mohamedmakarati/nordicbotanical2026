import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ExternalLink, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const EXAMPLE_RESULTS = [
  { store: "Plantagen", price: 249, currency: "SEK", stock: "I lager", shipping: 0, badge: "Billigast" },
  { store: "Blomsterlandet", price: 299, currency: "SEK", stock: "I lager", shipping: 49 },
  { store: "Wexthuset", price: 329, currency: "SEK", stock: "I lager", shipping: 39 },
  { store: "Zetas", price: 349, currency: "SEK", stock: "Begränsat", shipping: 49 },
  { store: "GardenStore", price: 389, currency: "SEK", stock: "I lager", shipping: 0 },
];

const QUICK_SEARCHES = ["Monstera", "Olivträd", "Lavendel", "Japansk lönn", "Fikonträd", "Orkidé"];

export default function PriceComparisonPreview() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section className="py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase">Prisjämförelse</span>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-4">
            Google Shopping — fast för växter
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Sök vilken växt som helst och se priser från alla nordiska butiker på ett ögonblick. Inklusive fraktkostnad.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Search form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSearch} className="flex gap-2 mb-5">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök t.ex. Monstera, Olivträd..."
                className="h-12 rounded-xl text-base flex-1"
              />
              <Button type="submit" size="lg" className="h-12 px-6 rounded-xl gap-2 shrink-0">
                <Search className="w-4 h-4" />
                Sök
              </Button>
            </form>

            {/* Quick searches */}
            <div className="flex flex-wrap gap-2 mb-8">
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                  className="px-3 py-1.5 rounded-full text-xs bg-card border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Value props */}
            <div className="space-y-3">
              {[
                { icon: TrendingDown, text: "Totalpris inklusive frakt — inga dolda kostnader" },
                { icon: Search, text: "Söker bland 50 000+ produkter i realtid" },
                { icon: ArrowRight, text: "Klicka direkt till butiken och köp" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Example table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <span className="font-display text-sm text-foreground">Monstera deliciosa</span>
                  <span className="text-xs text-muted-foreground ml-2">– exempelresultat</span>
                </div>
                <span className="text-xs text-muted-foreground">{EXAMPLE_RESULTS.length} butiker</span>
              </div>
              <div className="divide-y divide-border/40">
                {EXAMPLE_RESULTS.map((row, i) => (
                  <div
                    key={row.store}
                    className={`flex items-center px-5 py-3.5 gap-3 ${i === 0 ? "bg-primary/5" : "hover:bg-muted/30"} transition-colors`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{row.store}</span>
                        {row.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                            {row.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {row.shipping === 0 ? "Gratis frakt" : `Frakt ${row.shipping} SEK`} · {row.stock}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-base text-foreground">{row.price} {row.currency}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Totalt {row.price + row.shipping} SEK
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border/50 text-center">
                <Link to="/search?q=Monstera" className="text-xs text-primary hover:underline flex items-center justify-center gap-1">
                  Se verkliga priser <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}