import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { motion } from "framer-motion";
import PlantAssistant from "@/components/assistant/PlantAssistant";

const CATEGORIES = [
  { slug: "houseplants", label: "Krukväxter", emoji: "🌿", desc: "Gröna växter för hemmet" },
  { slug: "succulents", label: "Suckulenter", emoji: "🪴", desc: "Saftiga, lättskötta växter" },
  { slug: "cactus", label: "Kaktusar", emoji: "🌵", desc: "Törstiga och tåliga" },
  { slug: "orchid", label: "Orkidéer", emoji: "🌺", desc: "Eleganta blomsterväxter" },
  { slug: "herbs", label: "Örter", emoji: "🌱", desc: "Aromatiska köksörter" },
  { slug: "roses", label: "Rosor", emoji: "🌹", desc: "Klassiska trädgårdsrosor" },
  { slug: "lavender", label: "Lavendel", emoji: "💜", desc: "Doftande lavendelarter" },
  { slug: "hydrangea", label: "Hortensior", emoji: "💐", desc: "Färgsprakande hortensior" },
  { slug: "perennials", label: "Perenner", emoji: "🌸", desc: "Fleråriga trädgårdsväxter" },
  { slug: "trees", label: "Träd", emoji: "🌳", desc: "Prydnads- och fruktträd" },
  { slug: "shrubs", label: "Buskar", emoji: "🌿", desc: "Häckväxter och buskar" },
  { slug: "seeds", label: "Frön", emoji: "🌾", desc: "Frön och plantor" },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NordicBotanical.com",
  "url": "https://nordicbotanical.com",
  "description": "Nordens ledande prisjämförelse för växter. Jämför priser från hundratals nordiska växtbutiker.",
  "areaServed": ["Sweden", "Norway", "Denmark", "Finland"],
  "sameAs": ["https://nordicbotanical.com"],
};

export default function PlantsHub() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Växter – Prisöversikt | NordicBotanical.com"
        description="Jämför priser på alla typer av växter hos nordiska växtbutiker. Hitta bästa priset på krukväxter, suckulenter, rosor och mer."
        url="https://nordicbotanical.com/plants"
        structuredData={structuredData}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs font-medium text-primary tracking-widest uppercase">Växtguide</span>
              <h1 className="font-display text-5xl sm:text-6xl text-foreground mt-3 mb-4">Alla växter</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Bläddra bland alla växtkategorier och jämför priser från över 20 nordiska butiker.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/plants/${cat.slug}`}
                  className="group block bg-card rounded-2xl border border-border/60 p-5 text-center hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  <div className="text-4xl mb-3">{cat.emoji}</div>
                  <h2 className="font-display text-base text-foreground group-hover:text-primary transition-colors">{cat.label}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <PlantAssistant />
    </div>
  );
}