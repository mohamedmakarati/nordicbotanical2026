import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CreditCard, Smartphone, FileText, CheckCircle2, Loader2, ArrowLeft, Package } from "lucide-react";
import { motion } from "framer-motion";

const PAYMENT_METHODS = [
  { id: "stripe", label: "Kortbetalning", desc: "Visa, Mastercard, Amex", icon: CreditCard },
  { id: "klarna", label: "Klarna", desc: "Köp nu, betala senare", icon: FileText },
  { id: "swish", label: "Swish", desc: "Direktbetalning via Swish", icon: Smartphone },
];

export default function AuctionCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [user, setUser] = useState(null);
  const [method, setMethod] = useState("stripe");
  const [swishNumber, setSwishNumber] = useState("");
  const [address, setAddress] = useState({ name: "", street: "", zip: "", city: "" });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Auction.filter({ id }).catch(() => []),
      base44.auth.me().catch(() => null),
    ]).then(([auctions, me]) => {
      setAuction(auctions[0] || null);
      setUser(me);
      if (me) setAddress(a => ({ ...a, name: me.full_name || "" }));
      setLoading(false);
    });
  }, [id]);

  const totalAmount = auction
    ? (auction.current_bid || auction.buy_now_price || auction.starting_price || 0) + (auction.shipping_cost || 0)
    : 0;

  const handlePay = async () => {
    if (!user || !auction) return;
    setPaying(true);
    await base44.entities.Order.create({
      buyer_id: user.id,
      seller_id: auction.seller_id,
      auction_id: auction.id,
      item_title: auction.title,
      item_image_url: auction.image_urls?.[0] || null,
      amount: auction.current_bid || auction.starting_price || 0,
      currency: auction.currency || "SEK",
      shipping_cost: auction.shipping_cost || 0,
      total_amount: totalAmount,
      status: "pending_payment",
      payment_method: method,
      buyer_address: `${address.street}, ${address.zip} ${address.city}`,
    });
    await base44.entities.Auction.update(auction.id, { status: "sold" });
    await base44.entities.Notification.create({
      user_id: auction.seller_id,
      type: "order_placed",
      title: "Ny beställning!",
      message: `${user.full_name} har köpt "${auction.title}" för ${totalAmount} ${auction.currency}.`,
      link: "/auctions/dashboard",
    }).catch(() => {});
    setPaying(false);
    setDone(true);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-background"><Header />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col bg-background"><Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-display text-3xl text-foreground">Betalning mottagen!</h2>
          <p className="text-muted-foreground">Din beställning har bekräftats. Säljaren skickar din växt snart.</p>
          <div className="bg-muted/40 rounded-xl border border-border/40 p-4 text-sm text-left space-y-2">
            <p className="font-medium">{auction?.title}</p>
            <p className="text-muted-foreground">Totalt: <strong className="text-foreground">{totalAmount} {auction?.currency}</strong></p>
            <p className="text-muted-foreground">Betalningsmetod: <strong className="text-foreground">{PAYMENT_METHODS.find(m => m.id === method)?.label}</strong></p>
          </div>
          <Button className="w-full rounded-xl" onClick={() => navigate("/dashboard")}>
            <Package className="w-4 h-4 mr-2" /> Se mina beställningar
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );

  if (!auction) return (
    <div className="min-h-screen flex flex-col bg-background"><Header />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">Auktion hittades inte.</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link to={`/auctions/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tillbaka till auktionen
          </Link>
          <h1 className="font-display text-3xl text-foreground mb-8">Slutför köp</h1>

          <div className="grid gap-6">
            {/* Order summary */}
            <div className="bg-card border border-border/40 rounded-2xl p-5">
              <h2 className="font-medium text-foreground mb-4">Din beställning</h2>
              <div className="flex gap-4">
                {auction.image_urls?.[0] ? (
                  <img src={auction.image_urls[0]} alt={auction.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0 text-3xl">🌿</div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{auction.title}</p>
                  {auction.scientific_name && <p className="text-xs text-muted-foreground italic">{auction.scientific_name}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Säljare: {auction.seller_name}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/30 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vinnande bud</span>
                  <span>{(auction.current_bid || auction.starting_price || 0).toLocaleString()} {auction.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frakt</span>
                  <span>{auction.shipping_cost ? `${auction.shipping_cost} ${auction.currency}` : "Gratis"}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-border/20">
                  <span>Totalt</span>
                  <span className="text-primary">{totalAmount.toLocaleString()} {auction.currency}</span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
              <h2 className="font-medium text-foreground">Leveransadress</h2>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label>Namn</Label>
                  <Input value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} placeholder="För- och efternamn" />
                </div>
                <div className="space-y-1.5">
                  <Label>Gatuadress</Label>
                  <Input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="Gata och nummer" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Postnummer</Label>
                    <Input value={address.zip} onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))} placeholder="123 45" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stad</Label>
                    <Input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Stockholm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-card border border-border/40 rounded-2xl p-5">
              <h2 className="font-medium text-foreground mb-4">Betalningsmetod</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button key={pm.id} onClick={() => setMethod(pm.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${method === pm.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method === pm.id ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${method === pm.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.desc}</p>
                      </div>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === pm.id ? "border-primary" : "border-border/50"}`}>
                        {method === pm.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {method === "swish" && (
                <div className="mt-3 space-y-1.5">
                  <Label>Ditt Swish-nummer</Label>
                  <Input value={swishNumber} onChange={e => setSwishNumber(e.target.value)} placeholder="070-000 00 00" />
                  <p className="text-xs text-muted-foreground">Swish-betalning hanteras manuellt. Säljaren bekräftar när betalning mottagits.</p>
                </div>
              )}
            </div>

            {/* Shipping info */}
            {auction.shipping_methods?.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3">
                <h2 className="font-medium text-foreground">Leveransinfo</h2>
                <div className="flex flex-wrap gap-2">
                  {auction.shipping_methods.map(m => (
                    <span key={m} className="text-xs bg-accent text-accent-foreground rounded-lg px-3 py-1.5 font-medium capitalize">
                      {m === "postnord" ? "PostNord" : m === "dhl" ? "DHL" : m === "bring" ? "Bring" : m === "budbee" ? "Budbee" : m === "instabox" ? "Instabox" : m === "pickup" ? "🏠 Upphämtning" : m.replace("_", " ")}
                    </span>
                  ))}
                </div>
                {auction.pickup_available && auction.pickup_location && (
                  <p className="text-xs text-muted-foreground">📍 Upphämtning möjlig: <strong className="text-foreground">{auction.pickup_location}</strong></p>
                )}
                <p className="text-xs text-muted-foreground">Säljaren laddar upp spårningsnummer när paketet är avsänt. Du meddelas automatiskt.</p>
              </div>
            )}

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-xl p-3 border border-border/30">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              Betalningen hålls i escrow tills säljaren bekräftar avsändning. Din trygghet är vår prioritet.
            </div>

            <Button onClick={handlePay} disabled={paying || !address.street || !address.city}
              className="w-full h-12 rounded-xl text-base font-medium gap-2">
              {paying ? <><Loader2 className="w-5 h-5 animate-spin" /> Behandlar…</> : <><ShieldCheck className="w-5 h-5" /> Betala {totalAmount.toLocaleString()} {auction.currency}</>}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}