import { MapPin, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const SHOPS = [
  {
    name: "Plantagen",
    tagline: "Skandinaviens största växtkedja",
    country: "Sverige",
    plants: "5,000+",
    rating: 4.6,
    url: "#",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    verified: true,
  },
  {
    name: "Blomsterlandet",
    tagline: "Familjeägt nordiskt plantskola",
    country: "Sverige",
    plants: "3,200+",
    rating: 4.8,
    url: "#",
    image: "https://images.unsplash.com/photo-1534710961216-75c88202f43e?w=300&h=200&fit=crop",
    verified: true,
  },
  {
    name: "Plantorama",
    tagline: "Danmarks ledande växtdestination",
    country: "Danmark",
    plants: "4,100+",
    rating: 4.7,
    url: "#",
    image: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=300&h=200&fit=crop",
    verified: true,
  },
  {
    name: "Hageland",
    tagline: "Norska trädgårdsspecialister",
    country: "Norge",
    plants: "2,500+",
    rating: 4.5,
    url: "#",
    image: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=300&h=200&fit=crop",
    verified: false,
  },
];

export default function FeaturedShopsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14"
        >
          <div>
            <span className="text-xs font-medium text-primary tracking-widest uppercase">Katalog</span>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mt-3 mb-2">
              Utvalda växtbutiker
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg">
              Betrodda nordiska plantskolor och webbutiker som vi spårar dagligen
            </p>
          </div>
          <Button variant="outline" className="rounded-xl shrink-0 text-sm">
            Visa alla butiker
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SHOPS.map((shop, i) => (
            <motion.div
              key={shop.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl overflow-hidden bg-card border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {shop.verified && (
                  <div className="absolute top-3 left-3">
                    <Badge className="text-[10px] bg-primary/90 text-primary-foreground rounded-md px-2 py-0.5">
                      ✓ Verifierad
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display text-base text-foreground">{shop.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-muted-foreground">{shop.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{shop.tagline}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {shop.country}
                  </span>
                  <span className="text-muted-foreground">{shop.plants} växter</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}