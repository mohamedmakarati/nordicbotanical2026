import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const PLANT_CATEGORIES = [
  {
    label: "Krukväxter",
    image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=300&fit=crop",
    searches: ["Monstera", "Fredslilja", "Pothos", "Svärmorstunga"],
    badge: "Mest populärt",
  },
  {
    label: "Trädgårdsträd",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=300&fit=crop",
    searches: ["Olivträd", "Fikonträd", "Japansk lönn", "Magnolia"],
    badge: null,
  },
  {
    label: "Örter",
    image: "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=400&h=300&fit=crop",
    searches: ["Lavendel", "Rosmarin", "Basilika", "Mynta"],
    badge: null,
  },
  {
    label: "Trädgårdsblommor",
    image: "https://images.unsplash.com/photo-1490750967868-88df5691cc3e?w=400&h=300&fit=crop",
    searches: ["Rudbeckia", "Dahlia", "Echinacea", "Pion"],
    badge: "Säsongens val",
  },
];

export default function PopularSearches() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-xs font-medium text-primary tracking-widest uppercase">Utforska</span>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-3">
            Populära växtsökningar
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Bläddra bland de mest sökta växtkategorierna i nordiska butiker
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANT_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl overflow-hidden bg-card border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {cat.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                      {cat.badge}
                    </span>
                  </div>
                )}
                <h3 className="absolute bottom-3 left-4 font-display text-lg text-white">{cat.label}</h3>
              </div>
              <div className="p-4 space-y-2">
                {cat.searches.map((term) => (
                  <Link
                    key={term}
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-0.5 group/link"
                  >
                    <Search className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                    {term}
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}