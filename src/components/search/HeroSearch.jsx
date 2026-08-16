import { useState } from "react";
import { Search, Leaf, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import SearchSuggestions from "@/components/search/SearchSuggestions";

const POPULAR_SEARCHES = ["Monstera", "Olivträd", "Lavendel", "Rudbeckia", "Fiolbladsfikonträd", "Svärmorstunga"];

export default function HeroSearch({ onSearch, isSearching }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleQuickSearch = (term) => {
    setQuery(term);
    onSearch(term);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <Leaf className="w-3.5 h-3.5" />
            Jämför priser från 20+ nordiska växtbutiker
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.1] mb-4">
            Hitta bästa priset
            <br />
            <span className="text-primary">för varje växt</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-10 font-light">
            Sök bland tusentals växter i nordiska webbutiker. Jämför priser, fraktkostnader och tillgänglighet — allt på ett ställe.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-xl mx-auto"
        >
          <SearchSuggestions query={query} onSelect={handleQuickSearch} />
          <div className="relative flex items-center bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/60 p-1.5 transition-shadow focus-within:shadow-xl focus-within:shadow-primary/10 focus-within:border-primary/30">
            <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök efter en växt, t.ex. Monstera…"
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-base pl-3 h-12 placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="rounded-xl h-10 px-6 text-sm font-medium shrink-0"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                "Sök"
              )}
            </Button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Populärt:
          </span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => handleQuickSearch(term)}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            >
              {term}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}