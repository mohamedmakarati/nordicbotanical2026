import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Gavel, Eye, Heart, Leaf, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const TYPE_COLORS = {
  standard: "bg-primary/10 text-primary",
  buy_now: "bg-green-100 text-green-700",
  reserve: "bg-amber-100 text-amber-700",
  bulk: "bg-blue-100 text-blue-700",
  dutch: "bg-purple-100 text-purple-700",
  timed: "bg-orange-100 text-orange-700",
};

const TYPE_LABELS = {
  standard: "Auction",
  buy_now: "Buy Now",
  reserve: "Reserve",
  bulk: "Bulk",
  dutch: "Dutch",
  timed: "Timed",
};

const CONDITION_LABELS = {
  excellent: { label: "Excellent", color: "text-green-600" },
  good: { label: "Good", color: "text-primary" },
  fair: { label: "Fair", color: "text-amber-600" },
  needs_care: { label: "Needs Care", color: "text-red-500" },
};

export default function AuctionCard({ auction, index = 0 }) {
  const timeLeft = auction.end_date
    ? formatDistanceToNow(new Date(auction.end_date), { addSuffix: true })
    : "No end date";

  const isEndingSoon = auction.end_date && (new Date(auction.end_date) - Date.now()) < 3600000 * 24;
  const cond = CONDITION_LABELS[auction.condition] || CONDITION_LABELS.good;
  const currentPrice = auction.current_bid || auction.starting_price || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/auctions/${auction.id}`} className="group block bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {auction.image_urls?.[0] ? (
            <img src={auction.image_urls[0]} alt={auction.plant_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-12 h-12 text-primary/20" />
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[auction.auction_type] || TYPE_COLORS.standard}`}>
              {TYPE_LABELS[auction.auction_type] || "Auction"}
            </span>
            {auction.featured && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Featured</span>
            )}
            {isEndingSoon && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">🔥 Ending soon</span>
            )}
          </div>
          {/* Watchlist / views */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {auction.seller_type && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm capitalize">{auction.seller_type}</span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 flex gap-2 text-[10px] text-white">
            {auction.views > 0 && (
              <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Eye className="w-2.5 h-2.5" /> {auction.views}
              </span>
            )}
            {auction.watchlist_count > 0 && (
              <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Heart className="w-2.5 h-2.5" /> {auction.watchlist_count}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          <div>
            <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">{auction.title || auction.plant_name}</h3>
            {auction.scientific_name && (
              <p className="text-xs text-muted-foreground italic">{auction.scientific_name}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">{auction.bid_count > 0 ? `${auction.bid_count} bids` : "Starting at"}</p>
              <p className="font-bold text-lg text-foreground leading-none">
                {currentPrice.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{auction.currency}</span>
              </p>
              {auction.buy_now_price && (
                <p className="text-[10px] text-muted-foreground">Buy Now: {auction.buy_now_price.toLocaleString()} {auction.currency}</p>
              )}
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-[11px] ${isEndingSoon ? "text-red-500" : "text-muted-foreground"}`}>
                <Clock className="w-3 h-3" />
                <span>{timeLeft}</span>
              </div>
              <div className={`text-[10px] mt-0.5 ${cond.color}`}>{cond.label}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {auction.seller_name && (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary/60" />
                  {auction.seller_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {auction.pickup_available && <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md">Pickup</span>}
              {auction.shipping_cost === 0 && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">Free ship</span>}
              {auction.country && <span className="text-[10px]">{auction.country.slice(0, 2).toUpperCase()}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}