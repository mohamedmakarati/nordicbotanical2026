import { Link } from "react-router-dom";
import { Camera, Leaf, Stethoscope, Droplets, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: Leaf, label: "Växtnamn", desc: "Direkt identifiering av art och sort" },
  { icon: Stethoscope, label: "Sjukdomsdiagnos", desc: "Upptäck problem tidigt" },
  { icon: Droplets, label: "Skötselguide", desc: "Vatten, ljus och gödning" },
  { icon: ShoppingCart, label: "Billigaste butiken", desc: "Hitta bästa priset direkt" },
];

export default function AIIdentifySection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-medium text-primary tracking-widest uppercase">AI-teknik</span>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-4 leading-tight">
              Identifiera vilken växt som helst
              <br />
              <span className="text-primary">med ett foto</span>
            </h2>
            <p className="text-muted-foreground text-base mb-8 leading-relaxed max-w-lg">
              Ladda upp ett foto av valfri växt och vår AI ger dig omedelbart växtnamn, skötselråd, sjukdomsdiagnos och var du hittar den billigast i nordiska butiker.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="rounded-2xl px-8 h-12 gap-2">
              <Link to="/identify">
                <Camera className="w-4 h-4" />
                Identifiera en växt
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Right: visual mockup */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50">
              <img
                src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&h=500&fit=crop"
                alt="Plant identification"
                className="w-full h-72 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Overlay card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-border/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Leaf className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm text-foreground">Monstera deliciosa</div>
                    <div className="text-xs text-muted-foreground">Philodendron · Tropisk</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Frisk</span>
                      <span className="text-[10px] text-muted-foreground">Lägsta pris: <strong className="text-primary">149 SEK</strong> hos Plantagen</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-2xl shadow-lg">
              99% korrekt
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card border border-border shadow-lg rounded-2xl px-4 py-2.5 text-xs">
              <span className="text-muted-foreground">Identifierar på</span>
              <span className="font-display text-primary text-sm ml-1">3 sekunder</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}