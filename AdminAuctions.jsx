import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Star, Trash2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  ended: "bg-muted text-muted-foreground",
  sold: "bg-primary/10 text-primary",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_approval");

  const load = () => {
    setLoading(true);
    const query = filter === "all" ? {} : { status: filter };
    base44.entities.Auction.filter(query, "-created_date", 50)
      .then(setAuctions)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await base44.entities.Auction.update(id, { status });
    setAuctions((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  const toggleFeatured = async (a) => {
    await base44.entities.Auction.update(a.id, { featured: !a.featured });
    setAuctions((prev) => prev.map((x) => x.id === a.id ? { ...x, featured: !x.featured } : x));
  };

  const deleteAuction = async (id) => {
    if (!confirm("Delete this auction?")) return;
    await base44.entities.Auction.delete(id);
    setAuctions((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {["pending_approval", "active", "ended", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-10">Loading auctions…</div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          No {filter.replace("_", " ")} auctions.
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map((a) => (
            <div key={a.id} className="bg-card border border-border/40 rounded-xl px-4 py-3 flex items-center gap-4">
              {a.image_urls?.[0] ? (
                <img src={a.image_urls[0]} alt={a.plant_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xl">🌿</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.seller_name} · {a.country} · {a.bid_count || 0} bids · {a.starting_price} {a.currency}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || ""}`}>{a.status}</span>
                {a.status === "pending_approval" && (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => updateStatus(a.id, "active")}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => updateStatus(a.id, "cancelled")}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className={`h-7 px-2 ${a.featured ? "text-amber-500" : "text-muted-foreground"}`}
                  onClick={() => toggleFeatured(a)}>
                  <Star className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-red-500"
                  onClick={() => deleteAuction(a.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}