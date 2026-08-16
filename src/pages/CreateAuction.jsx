import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import ImageUploader from "@/components/ui/ImageUploader";
import PlantImageAIAnalyzer from "@/components/auction/PlantImageAIAnalyzer";
import AuctionAITools from "@/components/auction/AuctionAITools";
import { motion } from "framer-motion";

const STEPS = ["Plant Info", "Auction Setup", "Shipping", "Preview"];

const CATEGORIES = ["tropical", "succulent", "cactus", "fern", "orchid", "palm", "herb", "tree", "climbing", "rose", "other"];
const CONDITIONS = ["excellent", "good", "fair", "needs_care"];
const AUCTION_TYPES = ["standard", "buy_now", "reserve", "bulk", "dutch", "timed"];
const CURRENCIES = ["SEK", "NOK", "DKK", "EUR"];
const SHIPPING_OPTIONS = ["standard_post", "express", "pickup", "courier"];

const CONDITION_LABELS = { excellent: "Excellent", good: "Good", fair: "Fair", needs_care: "Needs Care" };
const TYPE_LABELS = { standard: "Standard Auction", buy_now: "Buy Now", reserve: "Reserve Price", bulk: "Bulk / Lot", dutch: "Dutch Auction", timed: "Timed Auction" };
const TYPE_DESCS = {
  standard: "Highest bidder wins when time expires",
  buy_now: "Set a fixed price for instant purchase",
  reserve: "Hidden minimum price — only sells if reserve met",
  bulk: "Sell multiple plants as a single lot",
  dutch: "Price decreases over time until a buyer accepts",
  timed: "Ends at a specific date and time",
};

export default function CreateAuction() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(null); // null = loading

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      // Admins are always verified; regular logged-in users can also create auctions
      if (u) {
        setIsVerified(true);
      } else {
        setIsVerified(false);
      }
    }).catch(() => {
      setIsVerified(false);
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);
  const [imageUrls, setImageUrls] = useState([]);
  const [form, setForm] = useState({
    plant_name: "",
    scientific_name: "",
    category: "tropical",
    description: "",
    condition: "good",
    age_months: "",
    height_cm: "",
    pot_size: "",
    quantity: 1,
    auction_type: "standard",
    starting_price: "",
    reserve_price: "",
    buy_now_price: "",
    currency: "SEK",
    end_date: "",
    shipping_methods: [],
    shipping_cost: 0,
    pickup_available: false,
    pickup_location: "",
    country: "Sweden",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleShipping = (method) => {
    set("shipping_methods", form.shipping_methods.includes(method)
      ? form.shipping_methods.filter((m) => m !== method)
      : [...form.shipping_methods, method]);
  };

  const submit = async () => {
    setSaving(true);
    const user = await base44.auth.me().catch(() => null);
    const urls = imageUrls.filter(Boolean);
    const payload = {
      ...form,
      title: form.plant_name + (form.scientific_name ? ` (${form.scientific_name})` : ""),
      starting_price: Number(form.starting_price),
      reserve_price: form.reserve_price ? Number(form.reserve_price) : undefined,
      buy_now_price: form.buy_now_price ? Number(form.buy_now_price) : undefined,
      age_months: form.age_months ? Number(form.age_months) : undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      image_urls: urls,
      seller_id: user?.id || "anonymous",
      seller_name: user?.full_name || "Anonymous",
      status: "pending_approval",
      bid_count: 0,
      views: 0,
    };
    const created = await base44.entities.Auction.create(payload);
    navigate(`/auctions/${created.id}`);
  };

  // Show gate for unverified sellers
  if (isVerified === false) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-display text-2xl text-foreground">Verification Required</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Only <strong>verified sellers</strong> can list plants in the auction marketplace. Please contact our team to get your seller account verified.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-left">
              <p className="font-medium mb-1">How to get verified:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Register your shop in the Seller Directory</li>
                <li>Contact admin to approve your seller status</li>
                <li>Once verified, you can list auction items and apply discounts</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/auctions")}>
                Back to Auctions
              </Button>
              <Button className="flex-1 rounded-xl" onClick={() => navigate("/sellers")}>
                Seller Directory
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <button onClick={() => navigate("/auctions")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Auctions
          </button>
          <div className="mb-8">
            <h1 className="font-display text-3xl text-foreground">List a Plant Auction</h1>
            <p className="text-muted-foreground text-sm mt-1">Reach thousands of Nordic plant buyers.</p>
          </div>

          {/* Step tabs */}
          <div className="flex gap-2 mb-8">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step || step === i ? setStep(i) : null}
                className={`flex-1 text-xs py-2 rounded-xl border transition-colors font-medium ${step === i ? "bg-primary text-primary-foreground border-primary" : i < step ? "border-primary/40 text-primary" : "border-border/40 text-muted-foreground"}`}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            {/* Step 0: Plant Info */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Plant Name *</Label>
                    <Input value={form.plant_name} onChange={(e) => set("plant_name", e.target.value)} placeholder="e.g. Monstera Deliciosa" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Scientific Name</Label>
                    <Input value={form.scientific_name} onChange={(e) => set("scientific_name", e.target.value)} placeholder="e.g. Monstera deliciosa" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => set("category", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Condition</Label>
                    <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{CONDITION_LABELS[c]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the plant's history, care, notable features..." rows={4} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Age (months)</Label>
                    <Input type="number" value={form.age_months} onChange={(e) => set("age_months", e.target.value)} placeholder="24" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Height (cm)</Label>
                    <Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="45" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pot Size</Label>
                    <Input value={form.pot_size} onChange={(e) => set("pot_size", e.target.value)} placeholder="17cm" />
                  </div>
                </div>
                {/* AI Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <Label>Ladda upp bild — AI fyller i formuläret</Label>
                  </div>
                  <PlantImageAIAnalyzer
                    onImageUploaded={(url) => setImageUrls((prev) => [...new Set([...prev, url])])}
                    onAnalysisDone={(ai) => {
                      if (ai.plant_name && !form.plant_name) set("plant_name", ai.plant_name);
                      if (ai.scientific_name && !form.scientific_name) set("scientific_name", ai.scientific_name);
                      if (ai.category) set("category", ai.category);
                      if (ai.condition) set("condition", ai.condition);
                      if (ai.pot_size && !form.pot_size) set("pot_size", ai.pot_size);
                      if (ai.description && !form.description) set("description", `${ai.description}${ai.care_info ? '\n\n' + ai.care_info : ''}`);
                      if (ai.auction_starting_price && !form.starting_price) set("starting_price", String(ai.auction_starting_price));
                      if (ai.suggested_price && !form.buy_now_price) set("buy_now_price", String(ai.suggested_price));
                    }}
                  />
                  {imageUrls.length > 0 && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Fler foton (upp till 8)</Label>
                      <ImageUploader multiple value={imageUrls} onChange={setImageUrls} maxImages={8} placeholder="Lägg till fler foton" />
                    </div>
                  )}
                </div>
                {/* AI Tools */}
                <AuctionAITools form={form} onUpdate={set} />
              </div>
            )}

            {/* Step 1: Auction Setup */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Auction Type *</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AUCTION_TYPES.map((t) => (
                      <button key={t} onClick={() => set("auction_type", t)}
                        className={`p-4 rounded-xl border text-left transition-all ${form.auction_type === t ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}>
                        <p className="font-medium text-sm text-foreground">{TYPE_LABELS[t]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{TYPE_DESCS[t]}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quantity</Label>
                    <Input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Starting Price *</Label>
                    <Input type="number" value={form.starting_price} onChange={(e) => set("starting_price", e.target.value)} placeholder="99" />
                  </div>
                  {(form.auction_type === "reserve" || form.auction_type === "standard") && (
                    <div className="space-y-1.5">
                      <Label>Reserve Price</Label>
                      <Input type="number" value={form.reserve_price} onChange={(e) => set("reserve_price", e.target.value)} placeholder="500" />
                    </div>
                  )}
                  {(form.auction_type === "buy_now" || form.auction_type === "standard") && (
                    <div className="space-y-1.5">
                      <Label>Buy Now Price</Label>
                      <Input type="number" value={form.buy_now_price} onChange={(e) => set("buy_now_price", e.target.value)} placeholder="999" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Auction End Date & Time *</Label>
                  <Input type="datetime-local" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2: Shipping */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-accent/40 border border-border/40 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">📦 Fraktmodell</p>
                  <p>Du som säljare bestämmer fraktkostnaden — köparen betalar frakt utöver budet. Välj fraktpartner och ange din kostnad nedan.</p>
                </div>

                <div>
                  <Label className="mb-3 block">Fraktpartner(s)</Label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { id: "postnord", label: "PostNord", desc: "Paket & brev, täcker hela Sverige" },
                      { id: "dhl", label: "DHL", desc: "Expressleverans, spårning ingår" },
                      { id: "bring", label: "Bring", desc: "Pålitligt för norra Sverige" },
                      { id: "budbee", label: "Budbee", desc: "Sista-milen leverans i storstäder" },
                      { id: "instabox", label: "Instabox", desc: "Paketbox-leverans, smidig för köpare" },
                      { id: "pickup", label: "Upphämtning", desc: "Köparen hämtar hos dig" },
                    ].map((m) => (
                      <button key={m.id} onClick={() => toggleShipping(m.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${form.shipping_methods.includes(m.id) ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}>
                        <p className="font-medium text-sm text-foreground">{m.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Fraktkostnad för köparen ({form.currency})</Label>
                  <Input type="number" min={0} value={form.shipping_cost} onChange={(e) => set("shipping_cost", Number(e.target.value))} placeholder="0 = Gratis frakt" />
                  <p className="text-xs text-muted-foreground">Ange 0 om du inkluderar frakt i priset. Köparen ser den exakta summan vid checkout.</p>
                </div>

                <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl">
                  <div>
                    <Label>Lokal upphämtning möjlig</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Köparen kan hämta direkt hos dig</p>
                  </div>
                  <Switch checked={form.pickup_available} onCheckedChange={(v) => set("pickup_available", v)} />
                </div>
                {form.pickup_available && (
                  <div className="space-y-1.5">
                    <Label>Upphämtningsadress / ort</Label>
                    <Input value={form.pickup_location} onChange={(e) => set("pickup_location", e.target.value)} placeholder="t.ex. Södermalm, Stockholm" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Avsändarland</Label>
                  <Select value={form.country} onValueChange={(v) => set("country", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Sweden", "Norway", "Denmark", "Finland", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-muted/30 rounded-2xl border border-border/40 p-5 space-y-3">
                  <h3 className="font-display text-xl text-foreground">{form.plant_name} {form.scientific_name ? `(${form.scientific_name})` : ""}</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    {[
                      ["Category", form.category],
                      ["Condition", CONDITION_LABELS[form.condition]],
                      ["Type", TYPE_LABELS[form.auction_type]],
                      ["Starting Price", `${form.starting_price} ${form.currency}`],
                      ["Reserve", form.reserve_price ? `${form.reserve_price} ${form.currency}` : "—"],
                      ["Buy Now", form.buy_now_price ? `${form.buy_now_price} ${form.currency}` : "—"],
                      ["Ends", form.end_date || "—"],
                      ["Shipping", form.shipping_cost === 0 ? "Free" : `${form.shipping_cost} ${form.currency}`],
                      ["Pickup", form.pickup_available ? form.pickup_location || "Yes" : "No"],
                      ["Country", form.country],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="text-muted-foreground">{k}: </span>
                        <span className="font-medium text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                  {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  ⏳ Your listing will be reviewed before going live. This usually takes less than 24 hours.
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" className="rounded-xl flex-1" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < 3 ? (
              <Button className="rounded-xl flex-1 gap-2" onClick={() => setStep(step + 1)}>
                Next: {STEPS[step + 1]} →
              </Button>
            ) : (
              <Button onClick={submit} disabled={saving || !form.plant_name || !form.starting_price || !form.end_date}
                className="rounded-xl flex-1 gap-2">
                <Gavel className="w-4 h-4" /> {saving ? "Submitting…" : "Submit Listing"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}