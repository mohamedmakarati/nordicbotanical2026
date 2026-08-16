import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Gavel, Zap, TrendingUp } from "lucide-react";

export default function BidPanel({ auction, user, onBidPlaced }) {
  const minBid = (auction.current_bid || auction.starting_price || 0) + 10;
  const [amount, setAmount] = useState(minBid);
  const [isAuto, setIsAuto] = useState(false);
  const [maxAuto, setMaxAuto] = useState(minBid + 100);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const placeBid = async () => {
    if (!user) {
      setError("Logga in för att lägga ett bud.");
      return;
    }
    if (amount < minBid) {
      setError(`Minsta bud är ${minBid} ${auction.currency}`);
      return;
    }
    setPlacing(true);
    setError("");

    const newBid = await base44.entities.Bid.create({
      auction_id: auction.id,
      bidder_id: user.id,
      bidder_name: user.full_name || "Anonymous",
      amount,
      currency: auction.currency || "SEK",
      is_auto_bid: isAuto,
      max_auto_bid: isAuto ? maxAuto : null,
      status: "active",
      bid_time: new Date().toISOString(),
    });

    await base44.entities.Auction.update(auction.id, {
      current_bid: amount,
      current_bidder_id: user.id,
      bid_count: (auction.bid_count || 0) + 1,
    });

    onBidPlaced(newBid);
    setSuccess(true);
    setPlacing(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const buyNow = async () => {
    if (!user) { setError("Logga in för att köpa."); return; }
    setPlacing(true);
    await base44.entities.Auction.update(auction.id, { status: "sold", current_bid: auction.buy_now_price, current_bidder_id: user.id });
    setSuccess(true);
    setPlacing(false);
  };

  return (
    <div className="space-y-4">
      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium text-center">
          🎉 Budet har lagts!
        </div>
      ) : null}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Standard bid */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Ditt bud ({auction.currency})</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={minBid}
            className="rounded-xl"
          />
          <Button onClick={placeBid} disabled={placing} className="gap-2 rounded-xl px-5 shrink-0">
            <Gavel className="w-4 h-4" /> {placing ? "Skickar…" : "Buda"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Minsta bud: {minBid.toLocaleString()} {auction.currency}</p>
      </div>

      {/* Auto bid */}
      <div className="border border-border/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <Label className="text-sm font-medium">Automatiskt bud</Label>
          </div>
          <Switch checked={isAuto} onCheckedChange={setIsAuto} />
        </div>
        {isAuto && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Högsta automatiska bud</Label>
            <Input type="number" value={maxAuto} onChange={(e) => setMaxAuto(Number(e.target.value))} className="rounded-xl" />
            <p className="text-xs text-muted-foreground">Vi budar automatiskt för dig upp till detta belopp.</p>
          </div>
        )}
      </div>

      {/* Buy Now */}
      {auction.buy_now_price && (
        <Button variant="outline" onClick={buyNow} disabled={placing} className="w-full gap-2 rounded-xl border-green-300 text-green-700 hover:bg-green-50">
          <Zap className="w-4 h-4" /> Köp nu för {auction.buy_now_price.toLocaleString()} {auction.currency}
        </Button>
      )}
    </div>
  );
}