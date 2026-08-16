import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, User, Building, Edit2, Trash2, Search, Loader2, Star, DollarSign } from "lucide-react";

export default function AdminSellerManagement() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    base44.entities.SellerProfile.list("-created_date", 100).then(d => { setSellers(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const update = async (id, data) => {
    await base44.entities.SellerProfile.update(id, data);
    setSellers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    setEditing(null);
  };

  const filtered = sellers.filter(s => !search || s.display_name?.toLowerCase().includes(search.toLowerCase()) || s.business_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground mb-1">Säljarhantering</h2>
          <p className="text-sm text-muted-foreground">{sellers.length} säljare registrerade</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök säljare…" className="pl-9" />
      </div>

      <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Säljare</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-3 py-3">Typ</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-3 py-3">Status</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-3 py-3">Provision %</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-3 py-3">Sälj</th>
                <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {s.avatar_url ? <img src={s.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div>}
                      <div>
                        <p className="font-medium text-foreground text-sm">{s.display_name}</p>
                        {s.business_name && <p className="text-xs text-muted-foreground">{s.business_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.seller_type}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {s.status === "active" ? "Aktiv" : s.status === "pending" ? "Väntar" : "Avstängd"}
                    </span>
                    {s.verified_badge && <ShieldCheck className="w-3.5 h-3.5 text-primary inline ml-1" />}
                    {s.premium_seller && <Star className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-muted-foreground text-xs">
                      <DollarSign className="w-3 h-3" />{s.commission_rate ?? 10}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-muted-foreground">{s.total_sales || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editing?.id === s.id ? (
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue={s.commission_rate ?? 10}
                            className="w-16 h-7 text-xs" id={`comm-${s.id}`} />
                          <Button size="sm" className="h-7 text-xs rounded-lg px-2"
                            onClick={() => update(s.id, { commission_rate: Number(document.getElementById(`comm-${s.id}`).value) })}>
                            Spara
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg" onClick={() => setEditing(null)}>✕</Button>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg" onClick={() => setEditing(s)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost"
                            className={`h-7 px-2 rounded-lg ${s.premium_seller ? "text-amber-500" : "text-muted-foreground"}`}
                            onClick={() => update(s.id, { premium_seller: !s.premium_seller })}>
                            <Star className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}