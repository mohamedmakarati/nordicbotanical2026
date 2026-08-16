import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ShieldCheck, User, Building, MapPin, Phone, Loader2 } from "lucide-react";

const TYPE_LABELS = {
  individual: "Privatperson",
  business: "Växtbutik",
  nursery: "Plantskola",
  wholesaler: "Grossist",
  garden_center: "Trädgårdscenter",
};

const STATUS_FILTERS = [
  { v: "pending", l: "Väntar godkännande" },
  { v: "active", l: "Godkända" },
  { v: "suspended", l: "Avstängda" },
  { v: "all", l: "Alla" },
];

export default function AdminSellerApproval() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    const query = filter === "all" ? {} : { status: filter };
    const data = await base44.entities.SellerProfile.filter(query, "-created_date", 50).catch(() => []);
    setSellers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    await base44.entities.SellerProfile.update(id, { status, verified_badge: status === "active" });
    setSellers(prev => prev.map(s => s.id === id ? { ...s, status, verified_badge: status === "active" } : s));
    setUpdating(null);
  };

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ v, l }) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Inga säljare att visa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map(s => (
            <div key={s.id} className="bg-card border border-border/40 rounded-xl p-4 flex items-start gap-4">
              {s.avatar_url ? (
                <img src={s.avatar_url} alt={s.display_name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground">{s.display_name}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{TYPE_LABELS[s.seller_type] || s.seller_type}</Badge>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {s.status === "active" ? "Godkänd" : s.status === "pending" ? "Väntar" : "Avstängd"}
                  </span>
                  {s.verified_badge && <ShieldCheck className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  {s.business_name && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{s.business_name} {s.org_number && `· ${s.org_number}`}</span>}
                  {s.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}</span>}
                  {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                </div>
                {s.bio && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{s.bio}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {s.status !== "active" && (
                  <Button size="sm" variant="ghost"
                    className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                    disabled={updating === s.id}
                    onClick={() => updateStatus(s.id, "active")}>
                    {updating === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                )}
                {s.status !== "suspended" && (
                  <Button size="sm" variant="ghost"
                    className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={updating === s.id}
                    onClick={() => updateStatus(s.id, "suspended")}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}