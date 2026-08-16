import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/ui/ImageUploader";
import { CheckCircle2, Store, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SELLER_TYPES = [
  { value: "individual", label: "Privatperson", desc: "Säljer egna växter privat" },
  { value: "business", label: "Växtbutik", desc: "Registrerad växthandel" },
  { value: "nursery", label: "Plantskola", desc: "Yrkesmässig växtodling" },
  { value: "wholesaler", label: "Grossist", desc: "Grossist & storsäljare" },
  { value: "garden_center", label: "Trädgårdscenter", desc: "Komplett trädgårdshandel" },
];

const SWEDISH_CITIES = ["Stockholm","Göteborg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg","Jönköping","Norrköping","Lund","Umeå","Gävle","Borås","Södertälje","Eskilstuna","Halmstad","Växjö","Karlstad","Sundsvall","Östersund","Trollhättan","Luleå","Borlänge","Falun","Kalmar","Kristianstad","Skövde"];

const DELIVERY_OPTIONS = [
  { value: "postnord", label: "PostNord" },
  { value: "dhl", label: "DHL" },
  { value: "bring", label: "Bring" },
  { value: "budbee", label: "Budbee" },
  { value: "instabox", label: "Instabox" },
];

export default function SellerRegistration() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    seller_type: "",
    display_name: "",
    business_name: "",
    org_number: "",
    bio: "",
    city: "",
    phone: "",
    avatar_url: "",
    logo_url: "",
    delivery_options: [],
    pickup_available: false,
    pickup_address: "",
    payment_methods: "",
    country: "Sweden",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleDelivery = (v) => {
    set("delivery_options", form.delivery_options.includes(v)
      ? form.delivery_options.filter(x => x !== v)
      : [...form.delivery_options, v]);
  };

  const submit = async () => {
    setSaving(true);
    const existing = await base44.entities.SellerProfile.filter({ user_id: user.id }).catch(() => []);
    const payload = {
      user_id: user.id,
      display_name: form.display_name || user.full_name,
      seller_type: form.seller_type || "individual",
      bio: form.bio,
      avatar_url: form.avatar_url,
      city: form.city,
      country: "Sweden",
      phone: form.phone,
      business_name: form.business_name,
      org_number: form.org_number,
      shipping_countries: "Sweden",
      payment_methods: form.payment_methods,
      status: "pending",
      joined_date: new Date().toISOString(),
    };
    if (existing.length > 0) {
      await base44.entities.SellerProfile.update(existing[0].id, payload);
    } else {
      await base44.entities.SellerProfile.create(payload);
    }
    // Also create/update Seller entity for marketplace
    const sellers = await base44.entities.Seller.filter({ contact_email: user.email }).catch(() => []);
    const sellerPayload = {
      seller_name: form.business_name || form.display_name || user.full_name,
      website_url: "",
      country: "Sweden",
      contact_email: user.email,
      verified_status: false,
    };
    if (sellers.length === 0) await base44.entities.Seller.create(sellerPayload);

    setSaving(false);
    setDone(true);
  };

  const STEPS = ["Typ av säljare", "Profil & kontakt", "Leverans", "Granska"];

  if (done) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-3xl text-foreground">Ansökan skickad!</h2>
          <p className="text-muted-foreground leading-relaxed">
            Din säljaransökan har skickats och granskas av vårt team. Du meddelas via e-post när du är godkänd — vanligtvis inom 24 timmar.
          </p>
          <div className="bg-accent/50 rounded-xl p-4 text-sm text-muted-foreground border border-border/40">
            <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-2" />
            <p>Alla säljare på Nordic Botanical verifieras manuellt för att garantera trygg handel.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/auctions")}>Se auktioner</Button>
            <Button className="flex-1 rounded-xl" onClick={() => navigate("/auctions/dashboard")}>Min dashboard</Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-foreground">Bli säljare</h1>
            <p className="text-muted-foreground mt-1 text-sm">Nå tusentals växtälskare i Sverige.</p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border/40"}`} />
                <p className={`text-[10px] mt-1 text-center transition-colors ${i === step ? "text-primary font-medium" : "text-muted-foreground"}`}>{s}</p>
              </div>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

            {/* Step 0: Seller type */}
            {step === 0 && (
              <div className="space-y-3">
                <h2 className="font-medium text-foreground">Vilken typ av säljare är du?</h2>
                {SELLER_TYPES.map(t => (
                  <button key={t.value} onClick={() => set("seller_type", t.value)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${form.seller_type === t.value ? "border-primary bg-primary/5 shadow-sm" : "border-border/40 hover:border-border"}`}>
                    <p className="font-medium text-sm text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Profile & Contact */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-medium text-foreground">Profil & kontaktuppgifter</h2>
                <div className="space-y-1.5">
                  <Label>Visningsnamn *</Label>
                  <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder={user?.full_name || "Ditt namn"} />
                </div>
                {(form.seller_type !== "individual") && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Företagsnamn</Label>
                      <Input value={form.business_name} onChange={e => set("business_name", e.target.value)} placeholder="AB Växtbutiken" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Organisationsnummer</Label>
                      <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="556xxx-xxxx" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label>Ort i Sverige *</Label>
                  <Select value={form.city} onValueChange={v => set("city", v)}>
                    <SelectTrigger><SelectValue placeholder="Välj stad…" /></SelectTrigger>
                    <SelectContent>
                      {SWEDISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Telefonnummer</Label>
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+46 70 000 00 00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Om dig / butiken</Label>
                  <Textarea value={form.bio} onChange={e => set("bio", e.target.value)}
                    placeholder="Berätta om dig själv, din specialitet och vilka växter du säljer…" rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label>Profilbild</Label>
                  <ImageUploader value={form.avatar_url ? [form.avatar_url] : []} onChange={urls => set("avatar_url", urls[0] || "")} maxImages={1} placeholder="Ladda upp profilbild" />
                </div>
                <div className="space-y-1.5">
                  <Label>Logotyp (JPG/PNG/WebP, max 2 MB, gärna kvadratisk)</Label>
                  <ImageUploader value={form.logo_url ? [form.logo_url] : []} onChange={urls => set("logo_url", urls[0] || "")} maxImages={1} placeholder="Ladda upp logotyp" />
                </div>
              </div>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-medium text-foreground">Leverans & betalning</h2>

                {/* Model info banner based on seller type */}
                {form.seller_type === "individual" ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">🏠 Privatperson — du bestämmer frakten</p>
                    <p className="text-xs">Du väljer fraktpartner och anger kostnaden per annons. Köparen betalar frakt vid checkout. Inget fraktkonto krävs.</p>
                  </div>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground">
                    <p className="font-medium mb-1">🏢 Företag / Plantskola — automatiserad frakt</p>
                    <p className="text-xs text-muted-foreground">Koppla ditt fraktkonto (PostNord, DHL, Bring). Fraktetiketter skapas automatiskt och spårningsnummer laddas upp direkt till köparen. <span className="text-primary font-medium">Kommer snart.</span></p>
                  </div>
                )}

                <div>
                  <Label className="mb-3 block">Fraktpartners du använder</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "postnord", label: "PostNord" },
                      { value: "dhl", label: "DHL" },
                      { value: "bring", label: "Bring" },
                      { value: "budbee", label: "Budbee" },
                      { value: "instabox", label: "Instabox" },
                    ].map(d => (
                      <button key={d.value} onClick={() => toggleDelivery(d.value)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.delivery_options.includes(d.value) ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl">
                  <div>
                    <Label>Lokal upphämtning möjlig</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Köpare kan hämta direkt hos dig</p>
                  </div>
                  <Switch checked={form.pickup_available} onCheckedChange={v => set("pickup_available", v)} />
                </div>
                {form.pickup_available && (
                  <div className="space-y-1.5">
                    <Label>Upphämtningsadress</Label>
                    <Input value={form.pickup_address} onChange={e => set("pickup_address", e.target.value)} placeholder="Gatuadress, stad" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Betalningsmetoder du accepterar</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Stripe (kort)", "Klarna", "Swish", "Faktura"].map(pm => {
                      const active = form.payment_methods.includes(pm);
                      return (
                        <button key={pm} onClick={() => {
                          const cur = form.payment_methods ? form.payment_methods.split(", ").filter(Boolean) : [];
                          const next = active ? cur.filter(x => x !== pm) : [...cur, pm];
                          set("payment_methods", next.join(", "));
                        }}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${active ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border"}`}>
                          {pm}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-muted/40 border border-border/30 rounded-xl p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">🚀 Kommande: Automatiserad frakt</p>
                  <p>Vi jobbar på att integrera PostNord, DHL och Bring API:er direkt i plattformen — automatiska fraktetiketter, spårningsnummer och köparmeddelanden utan manuellt arbete.</p>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-medium text-foreground">Granska din profil</h2>
                <div className="bg-muted/30 rounded-xl border border-border/40 p-5 space-y-3 text-sm">
                  {[
                    ["Typ", SELLER_TYPES.find(t => t.value === form.seller_type)?.label],
                    ["Namn", form.display_name || user?.full_name],
                    ["Företag", form.business_name || "—"],
                    ["Org.nr", form.org_number || "—"],
                    ["Ort", form.city || "—"],
                    ["Telefon", form.phone || "—"],
                    ["Frakt", form.delivery_options.join(", ") || "—"],
                    ["Upphämtning", form.pickup_available ? form.pickup_address || "Ja" : "Nej"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border/20 pb-2 last:border-0">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <ShieldCheck className="w-4 h-4 inline mr-1.5" />
                  Din profil granskas av admin innan den publiceras. Detta sker normalt inom 24 timmar.
                </div>
              </div>
            )}

          </motion.div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => setStep(s => s - 1)}>Tillbaka</Button>
            )}
            {step < 3 ? (
              <Button className="rounded-xl flex-1 gap-2" disabled={step === 0 && !form.seller_type}
                onClick={() => setStep(s => s + 1)}>
                Nästa <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button className="rounded-xl flex-1 gap-2" onClick={submit} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Skickar…</> : <><CheckCircle2 className="w-4 h-4" /> Skicka ansökan</>}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}