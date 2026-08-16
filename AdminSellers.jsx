import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle, Store, ShieldCheck, ShieldOff } from "lucide-react";
import ImageUploader from "@/components/ui/ImageUploader";

const COUNTRIES = ["Sweden", "Norway", "Denmark", "Finland", "Iceland", "Other"];

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ seller_name: "", website_url: "", country: "Sweden", affiliate_program: false, verified_status: false });

  useEffect(() => {
    base44.entities.Seller.list().then((data) => { setSellers(data); setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!form.seller_name || !form.website_url) return;
    setSaving(true);
    const created = await base44.entities.Seller.create(form);
    setSellers((prev) => [...prev, created]);
    setForm({ seller_name: "", website_url: "", country: "Sweden", affiliate_program: false, verified_status: false });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Ta bort denna butik?")) return;
    await base44.entities.Seller.delete(id);
    setSellers((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleVerified = async (s) => {
    const updated = await base44.entities.Seller.update(s.id, { verified_status: !s.verified_status });
    setSellers((prev) => prev.map((x) => x.id === s.id ? { ...x, verified_status: !x.verified_status } : x));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-muted-foreground">{sellers.length} butiker</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Lägg till butik
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-6 space-y-3">
          <h3 className="font-medium text-foreground">Ny butik</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Butiksnamn *" value={form.seller_name} onChange={(e) => setForm({ ...form, seller_name: e.target.value })} className="rounded-xl" />
            <Input placeholder="Webbadress *" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="rounded-xl" />
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.verified_status} onChange={(e) => setForm({ ...form, verified_status: e.target.checked })} className="rounded" />
                Verifierad
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.affiliate_program} onChange={(e) => setForm({ ...form, affiliate_program: e.target.checked })} className="rounded" />
                Affiliate
              </label>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Butikslogotyp</p>
            <ImageUploader
              value={form.logo_url || ""}
              onChange={(url) => setForm({ ...form, logo_url: url })}
              placeholder="Ladda upp logotyp"
              className="max-w-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl">
              {saving ? "Sparar..." : "Spara"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="rounded-xl">Avbryt</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div key={s.id} className="bg-card rounded-xl border border-border/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.seller_name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {s.seller_name}
                    {s.verified_status && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.country} · {s.website_url}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.affiliate_program && <Badge variant="secondary" className="text-xs rounded-md">Affiliate</Badge>}
                <Button
                  variant="ghost" size="sm"
                  className={`h-8 px-2 rounded-lg gap-1 text-xs font-medium ${s.verified_status ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                  onClick={() => toggleVerified(s)}
                  title={s.verified_status ? "Revoke verification" : "Verify seller"}
                >
                  {s.verified_status ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  {s.verified_status ? "Verified" : "Unverified"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}