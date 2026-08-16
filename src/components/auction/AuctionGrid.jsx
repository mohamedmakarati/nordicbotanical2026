import AuctionCard from "./AuctionCard";
import { Gavel } from "lucide-react";

export default function AuctionGrid({ auctions, loading, user }) {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  if (auctions.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Gavel className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground">Inga auktioner hittades med dessa filter</p>
    </div>
  );

  const sorted = [...auctions].sort((a, b) => {
    const aTotal = (a.current_bid || a.starting_price) + (a.shipping_cost || 0);
    const bTotal = (b.current_bid || b.starting_price) + (b.shipping_cost || 0);
    return aTotal - bTotal;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((a, i) => <AuctionCard key={a.id} auction={a} isBestDeal={i === 0} />)}
    </div>
  );
}