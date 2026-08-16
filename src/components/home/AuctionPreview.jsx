import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gavel, Clock, ArrowRight, Users, Building2, Package, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const STATIC_AUCTIONS = [
  { title: "Monstera Variegata Stickling", seller_name: "Privatperson", current_bid: 850, currency: "SEK", end_date: new Date(Date.now() + 2 * 86400000).toISOString(), status: "active", image_urls: ["https://images.unsplash.com/photo-1545241047-6083a3684587?w=300&h=300&fit=crop"] },
  { title: "Japanskt Lönträd 80cm", seller_name: "Plantskola", current_bid: 620, currency: "SEK", end_date: new Date(Date.now() + 5 * 3600000).toISOString(), status: "active", image_urls: ["https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&h=300&fit=crop"] },
  { title: "Olivträd Stort Exemplar", seller_name: "Butik", current_bid: 390, currency: "SEK", end_date: new Date(Date.now() + 86400000).toISOString(), status: "active", image_urls: ["https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=300&h=300&fit=crop"] },
];

function timeLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return "Avslutad";
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} dag${d > 1 ? "ar" : ""}`;
  if (h > 0) return `${h} tim`;
  return `${Math.floor(diff / 60000)} min`;
}

const SELLER_TYPES = [
  { icon: Users, label: "Privatpersoner", desc: "Sälj sällsynta växter", color: "bg-emerald-50 text-emerald-600" },
  { icon: Building2, label: "Plantskolor", desc: "Nå fler kunder", color: "bg-blue-50 text-blue-600" },
  { icon: Package, label: "Grossister", desc: "Sälj i bulk", color: "bg-violet-50 text-violet-600" },
];

export default function AuctionPreview() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    base44.entities.Auction.filter({ status: "active" }, "-created_date", 3)
      .then((data) => setAuctions(data.length ? data : STATIC_AUCTIONS))
      .catch(() => setAuctions(STATIC_AUCTIONS));
  }, []);

  const displayAuctions = auctions.length ? auctions : STATIC_AUCTIONS;

  return (
    <section className="py-24 bg-foreground text-background overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-xs font-medium text-green-400 tracking-widest uppercase">Växtauktioner</span>
            <h2 className="font-display text-3xl sm:text-4xl text-background mt-3 mb-2">
              Köp & sälj sällsynta
              <span className="text-green-400"> växter</span>
            </h2>
            <p className="text-background/55 text-base max-w-lg">
              Privatpersoner, plantskolor och grossister — för växter som inte finns i vanlig handel.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button asChild size="sm" className="rounded-xl h-9 bg-green-500 hover:bg-green-400 text-white border-0 gap-1.5">
              <Link to="/auctions"><Gavel className="w-3.5 h-3.5" /> Se alla</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl h-9 border-white/20 text-background hover:bg-white/10 gap-1.5">
              <Link to="/auctions/sell">Sälj din växt <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
        </motion.div>

        {/* Live auction cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {displayAuctions.slice(0, 3).map((auction, i) => (
            <motion.div
              key={auction.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={auction.id ? `/auctions/${auction.id}` : "/auctions"}
                className="block bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 group"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-white/5">
                  {auction.image_urls?.[0] ? (
                    <img
                      src={auction.image_urls[0]}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gavel className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-display text-sm text-background leading-snug mb-2 line-clamp-1">{auction.title}</h3>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-background/50">{auction.seller_name}</span>
                    <div className="flex items-center gap-1 text-xs text-background/50">
                      <Clock className="w-3 h-3" />
                      {timeLeft(auction.end_date)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-background/40 uppercase tracking-wider">Aktuellt bud</div>
                      <div className="font-display text-lg text-green-400">
                        {(auction.current_bid || auction.starting_price || 0).toFixed(0)} {auction.currency || "SEK"}
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/20 text-[10px]">
                      Aktiv
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Seller types */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SELLER_TYPES.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-background">{label}</div>
                <div className="text-xs text-background/45">{desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}