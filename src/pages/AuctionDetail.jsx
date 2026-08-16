import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Clock, Gavel, Heart, Share2, ShieldCheck, Eye, ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BidPanel from "@/components/auction/BidPanel";
import { formatDistanceToNow, format } from "date-fns";

const CONDITION_LABELS = { excellent: "Excellent 🌟", good: "Good ✅", fair: "Fair 🟡", needs_care: "Needs Care 🌱" };

export default function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Auction.filter({ id }),
      base44.entities.Bid.filter({ auction_id: id }, "-bid_time", 20),
      base44.auth.me().catch(() => null),
    ]).then(([auctions, bids, user]) => {
      setAuction(auctions[0] || null);
      setBids(bids);
      setUser(user);
      setLoading(false);
    });
  }, [id]);

  const handleBidPlaced = (newBid) => {
    setBids((prev) => [newBid, ...prev]);
    setAuction((prev) => prev ? { ...prev, current_bid: newBid.amount, bid_count: (prev.bid_count || 0) + 1 } : prev);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!auction) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Auction not found.</div>
      <Footer />
    </div>
  );

  const currentPrice = auction.current_bid || auction.starting_price || 0;
  const timeLeft = auction.end_date ? formatDistanceToNow(new Date(auction.end_date), { addSuffix: true }) : "—";
  const isEnded = auction.end_date && new Date(auction.end_date) < new Date();
  const images = auction.image_urls?.length ? auction.image_urls : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Link to="/auctions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tillbaka till auktioner
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Images */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/40">
                {images[activeImg] ? (
                  <img src={images[activeImg]} alt={auction.plant_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-7xl">🌿</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${activeImg === i ? "border-primary" : "border-border/40"}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info + Bid */}
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="rounded-full capitalize">{auction.auction_type?.replace("_", " ")}</Badge>
                  {auction.featured && <Badge variant="secondary" className="rounded-full">⭐ Featured</Badge>}
                  {isEnded && <Badge variant="destructive" className="rounded-full">Ended</Badge>}
                </div>
                <h1 className="font-display text-3xl text-foreground">{auction.title}</h1>
                {auction.scientific_name && <p className="text-muted-foreground italic mt-1">{auction.scientific_name}</p>}
              </div>

              {/* Seller */}
              {auction.seller_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Sold by <strong className="text-foreground">{auction.seller_name}</strong></span>
                  <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded-full">{auction.seller_type}</span>
                </div>
              )}

              {/* Price + countdown */}
              <div className="bg-muted/40 border border-border/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{auction.bid_count > 0 ? `Current bid · ${auction.bid_count} bids` : "Starting price"}</p>
                    <p className="font-display text-4xl text-foreground">{currentPrice.toLocaleString()} <span className="text-xl text-muted-foreground">{auction.currency}</span></p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isEnded ? "text-red-500" : "text-foreground"}`}>
                      <Clock className="w-4 h-4" /> {isEnded ? "Ended" : timeLeft}
                    </div>
                    {auction.end_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(auction.end_date), "d MMM yyyy HH:mm")}</p>
                    )}
                  </div>
                </div>
                {auction.reserve_price && (
                  <p className="text-xs text-muted-foreground">Reserve: {auction.reserve_price.toLocaleString()} {auction.currency}</p>
                )}
                {auction.buy_now_price && (
                  <p className="text-xs text-green-600 font-medium">Buy Now: {auction.buy_now_price.toLocaleString()} {auction.currency}</p>
                )}
              </div>

              {/* Bid panel */}
              {!isEnded && <BidPanel auction={auction} user={user} onBidPlaced={handleBidPlaced} />}

              {/* Checkout if won/buy now */}
              {(isEnded && auction.current_bidder_id === user?.id) || auction.status === "sold" ? (
                <Button asChild className="w-full rounded-xl gap-2 h-11">
                  <a href={`/auctions/${auction.id}/checkout`}>🎉 Slutför köp</a>
                </Button>
              ) : null}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1" onClick={() => setWatched(!watched)}>
                  <Heart className={`w-4 h-4 ${watched ? "fill-red-500 text-red-500" : ""}`} />
                  {watched ? "Bevakar" : "Bevaka"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  <Share2 className="w-4 h-4" /> Dela
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl text-muted-foreground hover:text-red-500"
                  onClick={() => alert("Anmälan har skickats till admin.")}>
                  <Flag className="w-3.5 h-3.5" /> Anmäl
                </Button>
              </div>

              {/* Plant details */}
              <div className="space-y-2">
                {[
                  { label: "Category", value: auction.category },
                  { label: "Condition", value: CONDITION_LABELS[auction.condition] },
                  { label: "Age", value: auction.age_months ? `${auction.age_months} months` : null },
                  { label: "Height", value: auction.height_cm ? `${auction.height_cm} cm` : null },
                  { label: "Pot size", value: auction.pot_size },
                  { label: "Quantity", value: auction.quantity > 1 ? auction.quantity : null },
                  { label: "Location", value: auction.country },
                  { label: "Pickup", value: auction.pickup_available ? auction.pickup_location || "Available" : null },
                  { label: "Shipping", value: auction.shipping_cost === 0 ? "Free" : auction.shipping_cost ? `${auction.shipping_cost} ${auction.currency}` : null },
                ].filter(d => d.value).map((d) => (
                  <div key={d.label} className="flex justify-between text-sm border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium text-foreground capitalize">{String(d.value)}</span>
                  </div>
                ))}
              </div>

              {auction.description && (
                <div>
                  <h3 className="font-medium text-sm text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{auction.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bid history */}
          {bids.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl text-foreground mb-4">Budhistorik</h2>
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
                {bids.map((bid, i) => (
                  <div key={bid.id} className={`flex items-center justify-between px-5 py-3 text-sm ${i < bids.length - 1 ? "border-b border-border/30" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {bid.bidder_name?.slice(0, 2).toUpperCase() || "??"}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{bid.bidder_name || "Anonymous"}</p>
                        {bid.is_auto_bid && <p className="text-[10px] text-muted-foreground">Auto bid</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{bid.amount.toLocaleString()} {bid.currency}</p>
                      {bid.bid_time && <p className="text-[10px] text-muted-foreground">{format(new Date(bid.bid_time), "d MMM HH:mm")}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}