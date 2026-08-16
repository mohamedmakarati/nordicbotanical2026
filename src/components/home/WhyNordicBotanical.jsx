import { ShieldCheck, Gavel, Bot, CreditCard, Star, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Admin-godkända säljare",
    description: "Varje säljare granskas och godkänns manuellt av vårt team innan de kan lista växter. Trygg handel för alla parter.",
    color: "text-primary bg-primary/10",
    highlight: true,
  },
  {
    icon: Bot,
    title: "AI-identifiering & prisförslag",
    description: "Ladda upp ett foto av din växt — vår AI identifierar arten och föreslår ett rimligt pris baserat på aktuell marknadsdata.",
    color: "text-violet-600 bg-violet-50",
    highlight: true,
  },
  {
    icon: Gavel,
    title: "Flexibla auktionsformat",
    description: "Standard, Köp Nu, Reservpris, Bulk och Holländsk auktion. Välj det format som passar din växt och ditt mål bäst.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: CreditCard,
    title: "Säker betalning — Stripe, Klarna & Swish",
    description: "Betalningen hålls i escrow tills säljaren bekräftar avsändning. Du är alltid skyddad som köpare.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: UserCheck,
    title: "Säljar- & köparprofiler",
    description: "Bygg din profil med logotyp, betyg och recensioner. Verifierade säljare får en blå bricka och ökat förtroende.",
    color: "text-amber-600 bg-amber-50",
  },
  {
    icon: Star,
    title: "Sällsynta växter — inte vanlig handel",
    description: "Nordic Botanical är platsen för växter som inte finns på Plantagen. Monstera Thai Constellation, sticklingar, bonsai och rariteteter.",
    color: "text-rose-600 bg-rose-50",
  },
];

export default function WhyNordicBotanical() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase">Varför Nordic Botanical</span>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-4">
            Sveriges tryggaste <br />
            <span className="text-primary">växtmarknad</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Auktioner, verifierade säljare, AI-verktyg och säkra betalningar — allt byggt för svenska växtälskare.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`flex gap-4 p-6 rounded-2xl border transition-colors ${
                  item.highlight
                    ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                    : "bg-card border-border/50 hover:border-primary/20"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}