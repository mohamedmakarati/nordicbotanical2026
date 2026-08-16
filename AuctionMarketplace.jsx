import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Gavel, Clock, TrendingUp, Star, Filter, Search, ChevronRight, Leaf, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuctionCard from "@/components/auction/AuctionCard";
import AuctionFilters from "@/components/auction/AuctionFilters";
import AuctionSidebarFilter from "@/components/auction/AuctionSidebarFilter";

const AUCTION_TYPE_LABELS = {
  standard: "Auction",
  buy_now: "Buy Now",
  reserve: "Reserve",
  bulk: "Bulk",
  dutch: "Dutch",
  timed: "Timed",
};

const STATS = [
  { icon: Gavel, label: "Active Auctions", value: "142" },
  { icon: TrendingUp, label: "Bids Today", value: "1,830" },
  { icon: Star, label: "Verified Sellers", value: "58" },
  { icon: Leaf, label: "Plant Species", value: "340+" },
];

export default function AuctionMarketplace() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ category: "all", type: "all", country: "all", plantType: "all", potSize: "all", maxPrice: 10000, species: "all" });
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    base44.entities.Auction.filter({ status: "active" }, "-created_date", 60)
      .then(setAuctions)
      .finally(() => setLoading(false));
  }, []);

  const filtered = auctions.filter((a) => {
    const q = searchQuery.toLowerCase();
    if (q && !a.plant_name?.toLowerCase().includes(q) && !a.title?.toLowerCase().includes(q) && !a.scientific_name?.toLowerCase().includes(q)) return false;
    if (filters.category !== "all" && a.category !== filters.category) return false;
    if (filters.type !== "all" && a.auction_type !== filters.type) return false;
    if (filters.country !== "all" && a.country !== filters.country) return false;
    if (filters.maxPrice && a.starting_price > filters.maxPrice) return false;
    if (filters.potSize !== "all" && a.pot_size) {
      const cm = parseInt(a.pot_size);
      if (filters.potSize === "small" && cm >= 12) return false;
      if (filters.potSize === "medium" && (cm < 12 || cm > 20)) return false;
      if (filters.potSize === "large" && (cm < 20 || cm > 30)) return false;
      if (filters.potSize === "xl" && cm < 30) return false;
    }
    if (filters.plantType !== "all") {
      const catMap = { indoor: ["tropical", "orchid", "herb"], outdoor: ["tree", "palm", "climbing"], exotic: ["succulent", "orchid", "cactus"] };
      if (!catMap[filters.plantType]?.includes(a.category)) return false;
    }
    return true;
  });

  const featured = filtered.filter((a) => a.featured);
  const regular = filtered.filter((a) => !a.featured);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/12 via-background to-accent/20 py-14 border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-medium mb-4">
                <Flame className="w-3.5 h-3.5" /> Live Plant Auctions
              </div>
              <h1 className="font-display text-5xl sm:text-6xl text-foreground mb-4">Nordic Plant Auctions</h1>
              <p className="text-muted-foreground max-w-xl mx-auto text-base">
                Buy and sell rare plants, orchids, and collector specimens across Scandinavia. Trusted by nurseries, collectors, and garden enthusiasts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <Button asChild size="lg" className="rounded-xl gap-2">
                  <Link to="/auctions/sell"><Gavel className="w-4 h-4" /> Start Selling</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl gap-2">
                  <Link to="/auctions/dashboard">My Dashboard</Link>
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-card/80 border border-border/40 rounded-2xl p-4 text-center">
                  <s.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="font-display text-2xl text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 py-3">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plants, species, sellers…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl lg:hidden" onClick={() => setShowSidebar(!showSidebar)}>
              <Filter className="w-4 h-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl hidden lg:flex" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" /> Quick Filters
            </Button>
            <Button asChild size="sm" className="rounded-xl gap-2 hidden sm:flex">
              <Link to="/auctions/sell"><Gavel className="w-4 h-4" /> Sell</Link>
            </Button>
          </div>
          {showFilters && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3">
              <AuctionFilters filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>

        {/* Sidebar + Main content */}
        <div className="flex-1 flex gap-0 lg:gap-6 lg:max-w-6xl lg:mx-auto lg:w-full lg:px-4 lg:sm:px-6">
          {/* Mobile sidebar overlay */}
          {showSidebar && (
            <div className="fixed inset-0 top-16 lg:hidden bg-black/40 z-20" onClick={() => setShowSidebar(false)} />
          )}
          <div className={`fixed left-0 top-16 bottom-0 z-30 w-80 lg:w-80 lg:static lg:top-auto lg:bg-transparent transition-all ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <AuctionSidebarFilter filters={filters} onChange={setFilters} onClose={() => setShowSidebar(false)} />
          </div>

          {/* Main content */}
          <div className="flex-1 px-4 sm:px-6 lg:px-0 py-8 space-y-10">
          {/* Featured */}
          {featured.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="font-display text-xl text-foreground">Featured Auctions</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((a, i) => <AuctionCard key={a.id} auction={a} index={i} />)}
              </div>
            </section>
          )}

          {/* All auctions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-foreground">
                {filtered.length > 0 ? `${filtered.length} Active Auctions` : "Active Auctions"}
              </h2>
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card border border-border/40 rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : regular.length === 0 && featured.length === 0 ? (
              <div className="text-center py-20">
                <Leaf className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No active auctions yet.</p>
                <Button asChild className="mt-4 rounded-xl gap-2">
                  <Link to="/auctions/sell"><Gavel className="w-4 h-4" /> List your first plant</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {regular.map((a, i) => <AuctionCard key={a.id} auction={a} index={i} />)}
              </div>
            )}
          </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}