import { Search, ArrowRight, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Sök efter en växt",
    description:
      "Skriv valfritt växtnamn — Monstera, Olivträd, Lavendel eller Solhatt. Vi söker direkt bland alla anslutna nordiska växtbutiker.",
    color: "bg-primary/10 text-primary",
  },
  {
    step: "02",
    icon: SlidersHorizontal,
    title: "Jämför & filtrera",
    description:
      "Filtrera efter land, krukstorlek, prisintervall och växttyp. Sortera resultaten från billigast till dyrast — inklusive fraktkostnader.",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    step: "03",
    icon: ShoppingCart,
    title: "Besök bästa butiken",
    description:
      "Klicka på 'Besök butik' för att gå direkt till bästa erbjudandet. Handla tryggt med vetskapen att du hittat det lägsta totalpriset.",
    color: "bg-accent text-accent-foreground",
  },
];

export default function HowItWorks() {
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
          <span className="text-xs font-medium text-primary tracking-widest uppercase">Så här fungerar det</span>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-4">
            Tre steg till bästa priset
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Nordic Botanical gör det enkelt att hitta det lägsta priset på vilken växt som helst i alla stora nordiska webbutiker.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
          {/* Connector lines */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="hidden md:block absolute top-12 left-1/2 right-1/4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-start p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-colors group"
              >
                <div className="flex items-center gap-4 mb-5 w-full">
                  <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-display text-4xl text-border/60 ml-auto">{step.step}</span>
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-5 top-12 w-4 h-4 text-border z-10" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}