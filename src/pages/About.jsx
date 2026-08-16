import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Leaf, TrendingDown, Gavel, Cpu, Users, Globe, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const STATS = [
  { value: "50 000+", label: "Växtlistningar" },
  { value: "120+", label: "Butiker & plantskolor" },
  { value: "5 länder", label: "Norden täckt" },
  { value: "AI-driven", label: "Bildanalys" },
];

const VALUES = [
  {
    icon: TrendingDown,
    title: "Transparenta priser",
    desc: "Vi samlar priser från hela Norden så att du alltid hittar bästa affären, utan att leta på 10 webbplatser.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Gavel,
    title: "Rättvis auktionsmarknad",
    desc: "Privatpersoner och plantskolor möts på lika villkor. Sällsynta växter hittar rätt ägare.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Cpu,
    title: "AI-driven kunskap",
    desc: "Identifiera växter, diagnostisera sjukdomar och få skötselråd — allt med ett foto.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Globe,
    title: "Nordisk gemenskap",
    desc: "Vi bygger den ledande växtgemenskapen för Sverige, Norge, Danmark och Finland.",
    color: "bg-violet-50 text-violet-600",
  },
];

const TEAM = [
  {
    name: "Nordic Botanical Team",
    role: "Grundarteam",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    bio: "Växtentusiaster och teknikexperter som vill göra det enklare att hitta och köpa växter i Norden.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-accent/30 to-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary tracking-widest uppercase">Om oss</span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground mt-4 mb-5 leading-tight">
                Nordens ledande
                <br />
                <span className="text-primary">växtplattform</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Nordic Botanical kombinerar prisjämförelse, auktioner och AI-teknologi för att göra det enklare att hitta, köpa och sälja växter i hela Norden.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-card border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {STATS.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="font-display text-3xl sm:text-4xl text-foreground mb-1">{value}</div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-xs font-medium text-primary tracking-widest uppercase">Vår mission</span>
                <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-5 leading-tight">
                  Demokratisera växtmarknaden i Norden
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Idag är växtmarknaden fragmenterad. Priser skiljer sig kraftigt mellan butiker, sällsynta växter är svåra att hitta, och det saknas en neutral plats för köpare och säljare att mötas.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Nordic Botanical löser detta. Vi är en oberoende plattform som samlar alla nordiska växtbutiker, erbjuder en transparent auktionsmarknad, och använder AI för att hjälpa dig med skötsel och identifiering.
                </p>
                <div className="flex gap-3">
                  <Button asChild className="rounded-xl gap-2">
                    <Link to="/search"><Leaf className="w-4 h-4" /> Sök växter</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl gap-2">
                    <Link to="/contact">Kontakta oss <ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <img
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=500&fit=crop"
                  alt="Växter"
                  className="w-full rounded-2xl object-cover shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-muted/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-xs font-medium text-primary tracking-widest uppercase">Värderingar</span>
              <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3">Vad vi tror på</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {VALUES.map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-4 p-6 bg-card rounded-2xl border border-border/50"
                >
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base text-foreground mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Shield className="w-10 h-10 text-primary/40 mx-auto mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-4">Redo att börja?</h2>
              <p className="text-muted-foreground mb-8">
                Gå med i tusentals växtentusiaster, säljare och plantskolor på Nordens ledande växtplattform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="rounded-2xl px-8 gap-2">
                  <Link to="/register"><Users className="w-4 h-4" /> Skapa konto gratis</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl px-8 gap-2">
                  <Link to="/search">Bläddra växter <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}