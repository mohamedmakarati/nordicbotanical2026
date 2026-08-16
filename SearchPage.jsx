import { useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/search/HeroSearch";
import SearchFilters from "@/components/search/SearchFilters";
import ResultsGrid from "@/components/search/ResultsGrid";
import SearchLoading from "@/components/search/SearchLoading";
import { AnimatePresence } from "framer-motion";
import PlantAssistant from "@/components/assistant/PlantAssistant";

const DEFAULT_FILTERS = {
  potSize: "All Sizes",
  maxPrice: 5000,
  sortBy: "lowest_price",
  category: "all",
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setResults(null);

    // Fetch all products and their linked plants + sellers
    const [products, plants, sellers] = await Promise.all([
      base44.entities.Product.list("-last_checked", 200),
      base44.entities.Plant.list(),
      base44.entities.Seller.list(),
    ]);

    const plantsMap = Object.fromEntries(plants.map((p) => [p.id, p]));
    const sellersMap = Object.fromEntries(sellers.map((s) => [s.id, s]));

    // Normalize common typo substitutions (3→e, 0→o, 1→i, 5→s, 7→t, 4→a)
    const normalize = (s) => (s || "").toLowerCase()
      .replace(/3/g, "e").replace(/0/g, "o").replace(/1/g, "i")
      .replace(/5/g, "s").replace(/7/g, "t").replace(/4/g, "a")
      .replace(/@/g, "a").replace(/\$/g, "s");
    const levenshtein = (a, b) => {
      const m = a.length, n = b.length;
      if (!m) return n; if (!n) return m;
      const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
      return dp[m][n];
    };
    const fuzzyMatch = (text, q) => {
      const normT = normalize(text);
      const normQ = normalize(q);
      if (normT.includes(normQ)) return true;
      const words = normT.split(/[\s\-_,.()]+/).filter(Boolean);
      return words.some(w => w.length >= 4 && levenshtein(normQ, w) <= 2);
    };

    const q = query;

    // Match products by product_title or linked plant name/scientific_name (with fuzzy typo tolerance)
    const matched = products.filter((prod) => {
      const titleMatch = fuzzyMatch(prod.product_title, q);
      const plant = plantsMap[prod.plant_id];
      const plantMatch = plant
        ? fuzzyMatch(plant.plant_name, q) || fuzzyMatch(plant.scientific_name, q)
        : false;
      return titleMatch || plantMatch;
    });

    // Enrich results
    const enriched = matched.map((prod) => {
      const plant = plantsMap[prod.plant_id] || {};
      const seller = sellersMap[prod.seller_id] || {};
      return {
        id: prod.id,
        name: prod.product_title,
        latin_name: plant.scientific_name || null,
        image_url: prod.image_url || plant.image_url || null,
        price: prod.price,
        regular_price: prod.regular_price || null,
        currency: prod.currency || "SEK",
        shipping_cost: prod.shipping_cost || 0,
        total_price: prod.total_price || prod.price,
        pot_size: prod.pot_size || null,
        availability: prod.availability || "in_stock",
        seller_name: seller.seller_name || "Okänd butik",
        seller_country: seller.country || null,
        product_url: prod.product_url || "#",
        last_checked: prod.last_checked,
        created_date: prod.created_date,
        category: plant.category || null,
      };
    });

    setResults(enriched);
    setIsSearching(false);
  }, []);

  // Auto-search if ?q= param is present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      handleSearch(q.trim());
    }
  }, [searchParams, handleSearch]);

  const filteredSortedResults = results
    ? results
        .filter((p) => {
          if (filters.maxPrice < 5000 && p.price > filters.maxPrice) return false;
          if (filters.category && filters.category !== "all" && p.category && p.category !== filters.category) return false;
          if (filters.potSize !== "All Sizes" && p.pot_size) {
            const cm = parseInt(p.pot_size);
            if (filters.potSize === "Small (< 12cm)" && cm >= 12) return false;
            if (filters.potSize === "Medium (12-20cm)" && (cm < 12 || cm > 20)) return false;
            if (filters.potSize === "Large (20-30cm)" && (cm < 20 || cm > 30)) return false;
            if (filters.potSize === "Extra Large (30cm+)" && cm < 30) return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (filters.sortBy === "lowest_price") return (a.price + a.shipping_cost) - (b.price + b.shipping_cost);
          if (filters.sortBy === "highest_discount") {
            const discA = a.regular_price ? ((a.regular_price - a.price) / a.regular_price) : 0;
            const discB = b.regular_price ? ((b.regular_price - b.price) / b.regular_price) : 0;
            return discB - discA;
          }
          if (filters.sortBy === "newest") return new Date(b.created_date) - new Date(a.created_date);
          return 0;
        })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <HeroSearch onSearch={handleSearch} isSearching={isSearching} />
          <AnimatePresence mode="wait">
            {isSearching ? (
              <SearchLoading key="loading" />
            ) : filteredSortedResults ? (
              <div key="results" className="pb-16">
                <SearchFilters filters={filters} onFiltersChange={setFilters} />
                <ResultsGrid results={filteredSortedResults} query={searchQuery} />
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
      <PlantAssistant />
    </div>
  );
}