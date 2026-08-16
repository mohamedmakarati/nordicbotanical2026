import { Gavel } from "lucide-react";
import { format } from "date-fns";

export default function BidHistory({ bids, currency }) {
  if (!bids.length) return null;

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><Gavel className="w-4 h-4 text-primary" />Budhistorik ({bids.length})</h3>
      <div className="space-y-2">
        {bids.map((bid, i) => (
          <div key={bid.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm ${i === 0 ? "bg-primary/8 border border-primary/20" : "bg-muted/30"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
              <div>
                <p className="font-medium">{bid.bidder_name || "Anonym"}</p>
                <p className="text-xs text-muted-foreground">{bid.bid_time ? format(new Date(bid.bid_time), "d MMM, HH:mm") : "–"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{bid.amount} {currency}</p>
              {bid.is_auto_bid && <p className="text-xs text-muted-foreground">Auto-bud</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}