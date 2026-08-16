import { Store, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const SHOPS = [
  { name: "Plantagen", country: "Sweden", plants: "5,000+", color: "bg-primary/10 text-primary" },
  { name: "Blomsterlandet", country: "Sweden", plants: "3,200+", color: "bg-accent text-accent-foreground" },
  { name: "Plantorama", country: "Denmark", plants: "4,100+", color: "bg-secondary text-secondary-foreground" },
  { name: "Greenify", country: "Denmark", plants: "2,800+", color: "bg-primary/10 text-primary" },
  { name: "Hageland", country: "Norway", plants: "2,500+", color: "bg-accent text-accent-foreground" },
  { name: "Mester Grønn", country: "Norway", plants: "1,900+", color: "bg-secondary text-secondary-foreground" },
];

export default function FeaturedShops() {
  return (
    <section className="py-16 border-t border-border/40">
      <div className="text-center mb-10">
        <h2 className="font-display text-2xl text-foreground mb-2">Featured Plant Shops</h2>
        <p className="text-sm text-muted-foreground">We compare prices from trusted Nordic nurseries and plant shops</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SHOPS.map((shop, i) => (
          <motion.div
            key={shop.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl ${shop.color} flex items-center justify-center shrink-0`}>
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{shop.name}</p>
              <p className="text-[11px] text-muted-foreground">{shop.country} · {shop.plants} plants</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Full seller directory coming soon <ArrowRight className="w-3 h-3" />
        </p>
      </div>
    </section>
  );
}