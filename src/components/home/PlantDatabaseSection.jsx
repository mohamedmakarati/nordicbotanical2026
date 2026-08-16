import { Link } from "react-router-dom";
import { ArrowRight, Sun, Droplets, Thermometer, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const PLANTS = [
  {
    name: "Olivträd",
    slug: "olive-tree",
    img: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=300&h=300&fit=crop",
    zone: "Zon 1–2",
    sun: "Fullt sol",
    water: "Lågt",
    hardiness: "Ej vinterhärdig",
    price: "fr. 249 SEK",
  },
  {
    name: "Monstera",
    slug: "monstera",
    img: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=300&h=300&fit=crop",
    zone: "Krukväxt",
    sun: "Ljus indirekt",
    water: "Måttligt",
    hardiness: "Inomhusväxt",
    price: "fr. 149 SEK",
  },
  {
    name: "Lavendel",
    slug: "lavender",
    img: "https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=300&h=300&fit=crop",
    zone: "Zon 1–5",
    sun: "Fullt sol",
    water: "Lågt",
    hardiness: "Härdig i Sverige",
    price: "fr. 59 SEK",
  },
  {
    name: "Japansk lönn",
    slug: "japanese-maple",
    img: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&h=300&fit=crop",
    zone: "Zon 1–3",
    sun: "Halvskugga",
    water: "Måttligt",
    hardiness: "Skyddat läge",
    price: "fr. 399 SEK",
  },
  {
    name: "Magnolia",
    slug: "magnolia",
    img: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=300&h=300&fit=crop",
    zone: "Zon 1–3",
    sun: "Sol/halvskugga",
    water: "Måttligt",
    hardiness: "Härdig zon 1–3",
    price: "fr. 299 SEK",
  },
  {
    name: "Fikonträd",
    slug: "fig-tree",
    img: "https://images.unsplash.com/photo-1563885960-73e4e80c0094?w=300&h=300&fit=crop",
    zone: "Zon 1–2",
    sun: "Fullt sol",
    water: "Måttligt",
    hardiness: "Ej vinterhärdig",
    price: "fr. 349 SEK",
  },
];

const SEO_LINKS = [
  { label: "Frön online", to: "/plants/seeds" },
  { label: "Perenner Sverige", to: "/plants/perennials" },
  { label: "Köp växter online", to: "/search" },
  { label: "Deals Plantagen", to: "/deals?seller=plantagen" },
  { label: "Billiga krukväxter", to: "/search?category=tropical" },
  { label: "Växter Impecta", to: "/deals?seller=impecta" },
];

export default function PlantDatabaseSection() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-xs font-medium text-primary tracking-widest uppercase">Växtdatabas</span>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-2">
              Tusentals växtguider
            </h2>
            <p className="text-muted-foreground text-base max-w-lg">
              Skötselguide, odlingszon, vattenbehov, vinterhärdighet och aktuella priser — allt samlat.
            </p>
          </div>
          <Link to="/plants" className="flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0 font-medium">
            Se alla växter <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLANTS.map((plant, i) => (
            <motion.div
              key={plant.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link
                to={`/plant/${plant.slug}`}
                className="group flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={plant.img}
                    alt={plant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base text-foreground mb-2">{plant.name}</div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
                      <span className="truncate">{plant.zone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Sun className="w-3 h-3 text-yellow-500/80 shrink-0" />
                      <span className="truncate">{plant.sun}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Droplets className="w-3 h-3 text-blue-500/80 shrink-0" />
                      <span className="truncate">{plant.water}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Thermometer className="w-3 h-3 text-orange-500/80 shrink-0" />
                      <span className="truncate">{plant.hardiness}</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-primary">{plant.price}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* SEO category links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 p-5 rounded-2xl bg-card border border-border/50"
        >
          <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Populära sökkategorier</p>
          <div className="flex flex-wrap gap-2">
            {SEO_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors bg-muted/30"
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}