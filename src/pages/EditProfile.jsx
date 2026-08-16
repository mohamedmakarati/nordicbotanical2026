import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Save, User, Globe, Building, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ACCOUNT_TYPES = [
  { value: "plant_buyer", label: "Växtköpare" },
  { value: "plant_seller", label: "Växtförsäljare" },
  { value: "nursery", label: "Plantskola" },
  { value: "wholesaler", label: "Grossist" },
  { value: "landscape_designer", label: "Landskapsdesigner" },
  { value: "plant_collector", label: "Växtsamlare" },
  { value: "botanical_garden", label: "Botanisk trädgård" },
  { value: "garden_center", label: "Trädgårdscenter" },
];

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me) { base44.auth.redirectToLogin(); return; }
      setUser(me);
      const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
      if (profiles[0]) {
        setProfile(profiles[0]);
        setForm(profiles[0]);
      } else {
        setForm({
          user_id: me.id,
          username: me.email?.split("@")[0]?.replace(/[^a-z0-9]/g, "") || "",
          display_name: me.full_name || "",
          account_type: "plant_buyer",
        });
      }
      setLoading(false);
    }).catch(() => { base44.auth.redirectToLogin(); });
  }, []);

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    field === "avatar_url" ? setUploadingAvatar(true) : setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, [field]: file_url }));
    field === "avatar_url" ? setUploadingAvatar(false) : setUploadingCover(false);
  };

  const handleSave = async () => {
    if (!form.username?.trim()) { toast({ title: "Användarnamn krävs", variant: "destructive" }); return; }
    setSaving(true);
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, form);
    } else {
      const newProfile = await base44.entities.UserProfile.create({ ...form, user_id: user.id });
      setProfile(newProfile);
    }
    setSaving(false);
    toast({ title: "Profilen sparad!" });
    navigate(`/profile/${form.username}`);
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl text-foreground mb-8">Redigera profil</h1>

          {/* Cover photo */}
          <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent mb-4">
            {form.cover_url && <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />}
            <label className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 cursor-pointer transition-colors group">
              <div className="bg-white/90 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-medium">
                <Camera className="w-3.5 h-3.5" />
                {uploadingCover ? "Laddar upp..." : "Byt omslagsbild"}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "cover_url")} />
            </label>
          </div>

          {/* Avatar */}
          <div className="flex items-end gap-4 mb-8 -mt-8 pl-4">
            <div className="relative w-20 h-20 rounded-2xl border-4 border-background overflow-hidden bg-card shadow-lg">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary/50" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "avatar_url")} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground pb-1">{uploadingAvatar ? "Laddar upp..." : "Klicka för att byta profilbild"}</p>
          </div>

          <div className="space-y-6">
            {/* Account type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Kontotyp</label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => set("account_type", t.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                      form.account_type === t.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2"><User className="w-4 h-4" />Grunduppgifter</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Visningsnamn</label>
                  <Input value={form.display_name || ""} onChange={(e) => set("display_name", e.target.value)} className="rounded-xl" placeholder="Ditt namn" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Användarnamn *</label>
                  <Input value={form.username || ""} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="rounded-xl" placeholder="ditt-användarnamn" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <textarea
                  value={form.bio || ""}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Berätta lite om dig själv..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Land</label>
                  <Input value={form.country || ""} onChange={(e) => set("country", e.target.value)} className="rounded-xl" placeholder="Sverige" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Stad</label>
                  <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} className="rounded-xl" placeholder="Stockholm" />
                </div>
              </div>
            </div>

            {/* Online presence */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2"><Globe className="w-4 h-4" />Online-närvaro</h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Webbplats</label>
                <Input value={form.website || ""} onChange={(e) => set("website", e.target.value)} className="rounded-xl" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Instagram</label>
                  <Input value={form.instagram || ""} onChange={(e) => set("instagram", e.target.value)} className="rounded-xl" placeholder="användarnamn" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Facebook</label>
                  <Input value={form.facebook || ""} onChange={(e) => set("facebook", e.target.value)} className="rounded-xl" placeholder="sida" />
                </div>
              </div>
            </div>

            {/* Business info */}
            {["plant_seller", "nursery", "wholesaler", "botanical_garden", "garden_center"].includes(form.account_type) && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
                <h2 className="text-sm font-medium text-foreground flex items-center gap-2"><Building className="w-4 h-4" />Företagsinformation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Företagsnamn</label>
                    <Input value={form.business_name || ""} onChange={(e) => set("business_name", e.target.value)} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Org.nummer</label>
                    <Input value={form.org_number || ""} onChange={(e) => set("org_number", e.target.value)} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Leveransländer (kommaseparerat)</label>
                  <Input value={form.shipping_countries || ""} onChange={(e) => set("shipping_countries", e.target.value)} className="rounded-xl" placeholder="Sverige, Norge, Danmark" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Betalningsmetoder (kommaseparerat)</label>
                  <Input value={form.payment_methods || ""} onChange={(e) => set("payment_methods", e.target.value)} className="rounded-xl" placeholder="Swish, Kortbetalning, Faktura" />
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11 gap-2 text-base">
              <Save className="w-4 h-4" />
              {saving ? "Sparar..." : "Spara profil"}
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}