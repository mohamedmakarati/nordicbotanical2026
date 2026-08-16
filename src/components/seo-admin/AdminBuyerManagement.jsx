import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ShoppingBag, Heart, Bell, User, Package } from "lucide-react";

export default function AdminBuyerManagement() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("users");

  useEffect(() => {
    Promise.all([
      base44.entities.User.list("-created_date", 100).catch(() => []),
      base44.entities.Order.list("-created_date", 50).catch(() => []),
    ]).then(([u, o]) => { setUsers(u); setOrders(o); setLoading(false); });
  }, []);

  const filtered = users.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const ORDER_STATUS = {
    pending_payment: { l: "Väntar betalning", c: "bg-amber-100 text-amber-700" },
    paid: { l: "Betald", c: "bg-blue-100 text-blue-700" },
    shipped: { l: "Skickad", c: "bg-purple-100 text-purple-700" },
    delivered: { l: "Levererad", c: "bg-green-100 text-green-700" },
    cancelled: { l: "Avbruten", c: "bg-red-100 text-red-700" },
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Köparhantering</h2>
        <p className="text-sm text-muted-foreground">{users.length} användare · {orders.length} beställningar</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[["users", "Användare", users.length, User], ["orders", "Beställningar", orders.length, Package]].map(([v, l, n, TabIcon]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`p-4 rounded-xl border text-left transition-all ${tab === v ? "border-primary bg-primary/5" : "border-border/40 hover:border-border bg-card"}`}>
            <TabIcon className={`w-4 h-4 mb-2 ${tab === v ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-lg font-bold text-foreground">{n}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök användare…" className="pl-9" />
          </div>
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Användare</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-3 py-3">Roll</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-3 py-3">Registrerad</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map(u => (
                    <tr key={u.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-3 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{u.role || "user"}</span></td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{u.created_date ? new Date(u.created_date).toLocaleDateString("sv-SE") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Produkt</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-3 py-3">Belopp</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-3 py-3">Betalning</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-3 py-3">Status</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Datum</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sc = ORDER_STATUS[o.status] || { l: o.status, c: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={o.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground text-sm max-w-[200px] truncate">{o.item_title}</td>
                      <td className="px-3 py-3 text-right font-semibold text-foreground">{o.total_amount?.toLocaleString()} {o.currency}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground capitalize">{o.payment_method || "—"}</td>
                      <td className="px-3 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.c}`}>{sc.l}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{o.created_date ? new Date(o.created_date).toLocaleDateString("sv-SE") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}