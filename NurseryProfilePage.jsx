import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  MapPin, Phone, Globe, Instagram, Facebook, CheckCircle, ChevronRight,
  Clock, Star, Package, Mail, Calendar, Leaf, Send, ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NurseryProductCatalog from "@/components/nursery/NurseryProductCatalog";
import NurseryReviews from "@/components/nursery/NurseryReviews";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_HOURS = {
  Mon: "09:00–17:00", Tue: "09:00–17:00", Wed: "09:00–17:00",
  Thu: "09:00–17:00", Fri: "09:00–17:00", Sat: "10:00–15:00", Sun: "Stängt"
};
const DAY_LABELS = { Mon: "Måndag", Tue: "Tisdag", Wed: "Onsdag", Thu: "Torsdag", Fri: "Fredag", Sat: "Lördag", Sun: "Söndag" };

export default function NurseryProfilePage() {
  const { slug } = useParams();
  const [nursery, setNursery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("catalog");
  const [inquiryForm, setInquiryForm] = useState({ sender_name: "", sender_email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    base44.entities.NurseryProfile.filter({ slug }).then(([found]) => {
      setNursery(found || null);
      setLoading(false);
    });
  }, [slug]);

  const handleSendInquiry = async () => {
    if (!inquiryForm.sender_name || !inquiryForm.sender_email || !inquiryForm.message) {
      toast({ title: "Fyll i alla fält", variant: "destructive" }); return;
    }
    setSending(true);
    await base44.entities.NurseryInquiry.create({ ...inquiryForm, nursery_id: nursery.id, nursery_name: nursery.business_name });
    setSent(true);
    setSending(false);
    toast({ title: "Förfrågan skickad!", description: "Vi återkommer till dig inom kort." });
  };

  const hours = (() => {
    try { return nursery?.opening_hours ? JSON.parse(nursery.opening_hours) : DEFAULT_HOURS; }
    catch { return DEFAULT_HOURS; }
  })();

  const yearsInBusiness = nursery?.founded_year ? new Date().getFullYear() - nursery.founded_year : null;

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!nursery) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Plantskolan hittades inte.</p>
          <Link to="/sellers" className="text-sm text-primary mt-3 inline-block hover:underline">← Butiker</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const TABS = [
    { id: "catalog", label: "Produktkatalog" },
    { id: "about", label: "Om oss" },
    { id: "reviews", label: `Recensioner (${nursery.review_count || 0})` },
    { id: "contact", label: "Kontakt" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Hem</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/sellers" className="hover:text-foreground">Butiker</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{nursery.business_name}</span>
          </nav>
        </div>

        {/* Cover */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 via-accent to-secondary overflow-hidden mt-3">
          {nursery.cover_url && <img src={nursery.cover_url} alt="Cover" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Logo + header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-6 relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-xl shrink-0">
                {nursery.logo_url ? (
                  <img src={nursery.logo_url} alt={nursery.business_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-primary/60" />
                  </div>
                )}
              </div>
            </div>
            {nursery.website && (
              <Button asChild variant="outline" className="rounded-xl gap-2">
                <a href={nursery.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> Besök webbplats
                </a>
              </Button>
            )}
          </div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-3xl text-foreground">{nursery.business_name}</h1>
              {nursery.is_verified && (
                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1 text-xs">
                  <CheckCircle className="w-3 h-3" /> Verifierad
                </Badge>
              )}
            </div>
            {nursery.tagline && <p className="text-muted-foreground text-sm mb-3 italic">{nursery.tagline}</p>}

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              {[
                { label: "Produkter", value: nursery.total_products || 0, icon: Package },
                { label: "Betyg", value: nursery.avg_rating ? nursery.avg_rating.toFixed(1) : "—", icon: Star },
                { label: "År i branschen", value: yearsInBusiness ? `${yearsInBusiness} år` : "—", icon: Calendar },
                { label: "Recensioner", value: nursery.review_count || 0, icon: Mail },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-2xl border border-border/60 p-4 text-center">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <div className="font-display text-xl text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {(nursery.city || nursery.country) && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[nursery.city, nursery.country].filter(Boolean).join(", ")}</span>
              )}
              {nursery.phone && (
                <a href={`tel:${nursery.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="w-3 h-3" />{nursery.phone}</a>
              )}
              {nursery.website && (
                <a href={nursery.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <Globe className="w-3 h-3" />{nursery.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/60 mb-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pb-16">
            {activeTab === "catalog" && <NurseryProductCatalog nurseryId={nursery.id} sellerId={nursery.seller_id} />}

            {activeTab === "about" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {nursery.description && (
                    <div className="bg-card rounded-2xl border border-border/60 p-5">
                      <h2 className="font-display text-lg mb-3">Om oss</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{nursery.description}</p>
                    </div>
                  )}
                  {nursery.specialties && (
                    <div className="bg-card rounded-2xl border border-border/60 p-5">
                      <h2 className="font-display text-lg mb-3">Specialiteter</h2>
                      <div className="flex flex-wrap gap-2">
                        {nursery.specialties.split(",").map(s => (
                          <Badge key={s} variant="secondary" className="rounded-lg">{s.trim()}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {nursery.shipping_countries && (
                    <div className="bg-card rounded-2xl border border-border/60 p-5">
                      <h2 className="font-display text-lg mb-2">Leveransländer</h2>
                      <p className="text-sm text-muted-foreground">{nursery.shipping_countries}</p>
                    </div>
                  )}
                </div>

                {/* Opening hours */}
                <div className="bg-card rounded-2xl border border-border/60 p-5">
                  <h2 className="font-display text-lg mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Öppettider</h2>
                  <div className="space-y-2">
                    {Object.entries(DAY_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={hours[key] === "Stängt" ? "text-destructive/60 text-xs" : "text-foreground font-medium"}>
                          {hours[key] || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location */}
                {nursery.address && (
                  <div className="bg-card rounded-2xl border border-border/60 p-5">
                    <h2 className="font-display text-lg mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Adress</h2>
                    <p className="text-sm text-muted-foreground">{nursery.address}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nursery.address)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <MapPin className="w-3 h-3" /> Visa på karta
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && <NurseryReviews nurseryId={nursery.id} nurseryName={nursery.business_name} />}

            {activeTab === "contact" && (
              <div className="max-w-lg">
                <div className="bg-card rounded-2xl border border-border/60 p-6 space-y-4">
                  <h2 className="font-display text-xl">Skicka en förfrågan</h2>
                  {sent ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                      <p className="font-medium text-foreground">Förfrågan skickad!</p>
                      <p className="text-sm text-muted-foreground mt-1">Vi återkommer till dig snart.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Namn *</label>
                          <Input value={inquiryForm.sender_name} onChange={e => setInquiryForm(f => ({...f, sender_name: e.target.value}))} className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">E-post *</label>
                          <Input type="email" value={inquiryForm.sender_email} onChange={e => setInquiryForm(f => ({...f, sender_email: e.target.value}))} className="rounded-xl" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Ämne</label>
                        <Input value={inquiryForm.subject} onChange={e => setInquiryForm(f => ({...f, subject: e.target.value}))} className="rounded-xl" placeholder="Vad gäller det?" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Meddelande *</label>
                        <textarea rows={5} value={inquiryForm.message} onChange={e => setInquiryForm(f => ({...f, message: e.target.value}))}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Beskriv din förfrågan..." />
                      </div>
                      <Button onClick={handleSendInquiry} disabled={sending} className="w-full rounded-xl gap-2">
                        <Send className="w-4 h-4" />{sending ? "Skickar..." : "Skicka förfrågan"}
                      </Button>
                    </>
                  )}
                </div>

                {/* Contact details */}
                <div className="mt-4 bg-card rounded-2xl border border-border/60 p-5 space-y-3">
                  <h3 className="font-medium text-sm">Direktkontakt</h3>
                  {nursery.email && (
                    <a href={`mailto:${nursery.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-4 h-4" />{nursery.email}
                    </a>
                  )}
                  {nursery.phone && (
                    <a href={`tel:${nursery.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" />{nursery.phone}
                    </a>
                  )}
                  {nursery.instagram && (
                    <a href={`https://instagram.com/${nursery.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Instagram className="w-4 h-4" />@{nursery.instagram}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}