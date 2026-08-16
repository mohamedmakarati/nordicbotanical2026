import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Gavel, Clock, CheckCircle, Eye, TrendingUp, Heart, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const STATUS_BADGE = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending_approval: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
  sold: { label: "Sold", className: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600" },
};

export default function AuctionDashboard() {
  const [user, setUser] = useState(null);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().catch(() => null).then(async (u) => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      const [auctions, bids, wl] = await Promise.all([
        base44.entities.Auction.filter({ seller_id: u.id }, "-created_date", 50),
        base44.entities.Bid.filter({ bidder_id: u.id }, "-bid_time", 30),
        base44.entities.AuctionWatchlist.filter({ user_id: u.id }, "-created_date", 20),
      ]);
      setMyAuctions(auctions);
      setMyBids(bids);
      setWatchlist(wl);
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: "Active Listings", value: myAuctions.filter((a) => a.status === "active").length, icon: Gavel, color: "text-primary" },
    { label: "Total Bids Placed", value: myBids.length, icon: TrendingUp, color: "text-green-600" },
    { label: "Watching", value: watchlist.length, icon: Heart, color: "text-red-500" },
    { label: "Sold", value: myAuctions.filter((a) => a.status === "sold").length, icon: CheckCircle, color: "text-amber-600" },
  ];

  if (!loading && !user) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Sign in to view your auction dashboard.</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl text-foreground">My Auction Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.full_name?.split(" ")[0] || "Seller"} 🌿</p>
            </div>
            <Button asChild className="gap-2 rounded-xl">
              <Link to="/auctions/sell"><Plus className="w-4 h-4" /> New Listing</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-card border border-border/40 rounded-2xl p-4">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="font-display text-2xl text-foreground">{loading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue="listings">
            <TabsList className="rounded-xl mb-6">
              <TabsTrigger value="listings" className="rounded-lg">My Listings</TabsTrigger>
              <TabsTrigger value="bids" className="rounded-lg">My Bids</TabsTrigger>
              <TabsTrigger value="watchlist" className="rounded-lg">Watchlist</TabsTrigger>
            </TabsList>

            {/* My Listings */}
            <TabsContent value="listings">
              {loading ? <div className="text-sm text-muted-foreground text-center py-10">Loading…</div> :
                myAuctions.length === 0 ? (
                  <div className="text-center py-16">
                    <Gavel className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No listings yet.</p>
                    <Button asChild className="gap-2 rounded-xl"><Link to="/auctions/sell"><Plus className="w-4 h-4" /> Create Listing</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAuctions.map((a) => {
                      const badge = STATUS_BADGE[a.status] || STATUS_BADGE.draft;
                      return (
                        <Link key={a.id} to={`/auctions/${a.id}`}
                          className="flex items-center gap-4 bg-card border border-border/40 rounded-xl px-4 py-3 hover:border-primary/30 transition-colors">
                          {a.image_urls?.[0] ? (
                            <img src={a.image_urls[0]} alt={a.plant_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg">🌿</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.bid_count || 0} bids · {a.current_bid || a.starting_price} {a.currency}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                            {a.end_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatDistanceToNow(new Date(a.end_date), { addSuffix: true })}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
            </TabsContent>

            {/* My Bids */}
            <TabsContent value="bids">
              {loading ? <div className="text-sm text-muted-foreground text-center py-10">Loading…</div> :
                myBids.length === 0 ? (
                  <div className="text-center py-16">
                    <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">You haven't placed any bids yet.</p>
                    <Button asChild className="mt-4 rounded-xl"><Link to="/auctions">Browse Auctions</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBids.map((b) => (
                      <Link key={b.id} to={`/auctions/${b.auction_id}`}
                        className="flex items-center justify-between bg-card border border-border/40 rounded-xl px-4 py-3 hover:border-primary/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">Auction #{b.auction_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{b.is_auto_bid ? "Auto bid" : "Manual bid"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{b.amount.toLocaleString()} {b.currency}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.status === "active" ? "bg-green-100 text-green-700" : b.status === "won" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {b.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
            </TabsContent>

            {/* Watchlist */}
            <TabsContent value="watchlist">
              {loading ? <div className="text-sm text-muted-foreground text-center py-10">Loading…</div> :
                watchlist.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Your watchlist is empty.</p>
                    <Button asChild className="mt-4 rounded-xl"><Link to="/auctions">Browse Auctions</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {watchlist.map((w) => (
                      <Link key={w.id} to={`/auctions/${w.auction_id}`}
                        className="flex items-center gap-4 bg-card border border-border/40 rounded-xl px-4 py-3 hover:border-primary/30 transition-colors">
                        {w.image_url ? (
                          <img src={w.image_url} alt={w.auction_title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg">🌿</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{w.auction_title}</p>
                          <p className="text-xs text-muted-foreground">{w.current_bid ? `Bid: ${w.current_bid}` : "No bids yet"}</p>
                        </div>
                        {w.end_date && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0"><Clock className="w-2.5 h-2.5" />{formatDistanceToNow(new Date(w.end_date), { addSuffix: true })}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}