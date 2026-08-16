import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Mail, MapPin, Clock, CheckCircle2, Leaf, MessageSquare, HelpCircle, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const TOPICS = [
  { value: "general", label: "Allmän fråga" },
  { value: "seller", label: "Bli säljare" },
  { value: "auction", label: "Auktionsfråga" },
  { value: "payment", label: "Betalning & order" },
  { value: "technical", label: "Teknisk support" },
  { value: "partnership", label: "Samarbete" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "general", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: "hello@nordicbotanical.com",
      subject: `[${TOPICS.find(t => t.value === form.topic)?.label}] Kontaktformulär från ${form.name}`,
      body: `Namn: ${form.name}\nEmail: ${form.email}\nÄmne: ${form.topic}\n\nMeddelande:\n${form.message}`,
    });
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
            <span className="text-xs font-medium text-primary tracking-widest uppercase">Kontakt</span>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mt-3 mb-3">Hör av dig</h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Vi svarar inom 24 timmar på vardagar. Välkommen att kontakta oss om allt från säljarkonton till teknisk support.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {[
                {
                  icon: Mail,
                  title: "E-post",
                  value: "hello@nordicbotanical.com",
                  desc: "Vi svarar inom 24h på vardagar",
                  color: "bg-primary/10 text-primary",
                },
                {
                  icon: Clock,
                  title: "Öppettider",
                  value: "Mån–Fre 09–17",
                  desc: "Lördag–Söndag stängt",
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  icon: MapPin,
                  title: "Plats",
                  value: "Stockholm, Sverige",
                  desc: "Nordiska marknadens hjärta",
                  color: "bg-blue-50 text-blue-600",
                },
              ].map(({ icon: Icon, title, value, desc, color }) => (
                <div key={title} className="flex gap-4 p-5 bg-card rounded-2xl border border-border/50">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{title}</div>
                    <div className="font-medium text-foreground text-sm">{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}

              <div className="p-5 bg-primary/5 rounded-2xl border border-primary/15">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Bli säljare?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vill du sälja växter på Nordic Botanical? Skapa ett säljarkonto och börja lista dina växter idag.
                </p>
                <a href="/auctions/sell" className="inline-block mt-3 text-xs text-primary font-medium hover:underline">
                  Ansök om säljarkonto →
                </a>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-2xl border border-border/50 p-10 text-center"
                >
                  <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
                  <h2 className="font-display text-2xl text-foreground mb-2">Meddelande skickat!</h2>
                  <p className="text-muted-foreground text-sm">Vi återkommer till dig inom 24 timmar. Tack för att du hör av dig!</p>
                  <Button className="mt-6 rounded-xl" onClick={() => setSent(false)}>Skicka ett till</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 space-y-5">
                  <h2 className="font-display text-xl text-foreground mb-1">Skicka ett meddelande</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Namn *</label>
                      <Input
                        required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ditt namn" className="rounded-xl h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-post *</label>
                      <Input
                        required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="din@email.com" className="rounded-xl h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ämne</label>
                    <select
                      value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Meddelande *</label>
                    <Textarea
                      required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Beskriv din fråga eller ditt ärende..."
                      className="rounded-xl resize-none min-h-[140px]"
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full rounded-xl h-11 gap-2">
                    {sending ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Skickar...</>
                    ) : (
                      <><MessageSquare className="w-4 h-4" /> Skicka meddelande</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}