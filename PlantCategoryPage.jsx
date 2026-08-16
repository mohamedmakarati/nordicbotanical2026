import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/seo/SEOHead";
import PlantCard from "@/components/search/PlantCard";
import { motion } from "framer-motion";
import { Leaf, ChevronRight } from "lucide-react";

const CATEGORY_META = {
  houseplants: {
    title: "Krukväxter – Jämför priser | NordicBotanical",
    description: "Hitta de bästa priserna på krukväxter hos nordiska växtbutiker. Jämför hundratals växter från Plantagen, Blomsterlandet och mer.",
    heading: "Krukväxter",
    subheading: "Jämför priser på krukväxter hos alla nordiska växtbutiker",
    category: "tropical",
    emoji: "🌿",
  },
  succulents: {
    title: "Suckulenter – Jämför priser | NordicBotanical",
    description: "Köp suckulenter billigt. Jämför priser från Plantagen, Blomsterlandet och fler nordiska växtbutiker.",
    heading: "Suckulenter",
    subheading: "Saftiga växter för varje hem – jämför priser",
    category: "succulent",
    emoji: "🪴",
  },
  cactus: {
    title: "Kaktusar – Bästa pris | NordicBotanical",
    description: "Hitta billiga kaktusar online. Prisöversikt från nordiska växtbutiker.",
    heading: "Kaktusar",
    subheading: "Jämför kaktuspriser i Sverige, Norge, Danmark och Finland",
    category: "cactus",
    emoji: "🌵",
  },
  perennials: {
    title: "Perenner – Prisöversikt | NordicBotanical",
    description: "Jämför priser på perenner hos nordiska trädgårdsbutiker. Hitta bästa erbjudanden.",
    heading: "Perenner",
    subheading: "Fleråriga trädgårdsväxter – jämför priser",
    category: "other",
    emoji: "🌸",
  },
  herbs: {
    title: "Örter & Kryddor – Prisöversikt | NordicBotanical",
    description: "Köp örter och kryddväxter billigt. Jämför priser på basilika, rosmarin, timjan och mer.",
    heading: "Örter & Kryddor",
    subheading: "Aromatiska örter för köket och trädgården",
    category: "herb",
    emoji: "🌱",
  },
  orchid: {
    title: "Orkidéer – Prisöversikt | NordicBotanical",
    description: "Hitta bästa priset på orkidéer. Jämför Phalaenopsis och fler orkidéarter.",
    heading: "Orkidéer",
    subheading: "Eleganta orkidéer från nordiska växtbutiker",
    category: "orchid",
    emoji: "🌺",
  },
  trees: {
    title: "Träd & Buskar – Prisöversikt | NordicBotanical",
    description: "Jämför priser på träd och buskar hos nordiska trädgårdsbutiker.",
    heading: "Träd",
    subheading: "Prydnadsträd och fruktträd – jämför priser",
    category: "tree",
    emoji: "🌳",
  },
  shrubs: {
    title: "Buskar – Prisöversikt | NordicBotanical",
    description: "Jämför priser på buskar och häckväxter hos nordiska trädgårdsbutiker.",
    heading: "Buskar & Häckväxter",
    subheading: "Trädgårdsplantor och häckväxter – jämför priser",
    category: "climbing",
    emoji: "🌿",
  },
  seeds: {
    title: "Frön – Prisöversikt | NordicBotanical",
    description: "Jämför priser på frön och fröblandningar hos nordiska trädgårdsbutiker.",
    heading: "Frön",
    subheading: "Blomster-, grönsaks- och örtfrön – jämför priser",
    category: "other",
    emoji: "🌾",
  },
  roses: {
    title: "Rosor – Köp billigt | NordicBotanical",
    description: "Jämför priser på rosor hos svenska, norska och danska växtbutiker. Hitta bästa erbjudanden.",
    heading: "Rosor",
    subheading: "Rosa, röda, vita rosor – jämför priser",
    category: "other",
    emoji: "🌹",
  },
  lavender: {
    title: "Lavendel – Prisöversikt | NordicBotanical",
    description: "Hitta bästa pris på lavendel. Lavandula angustifolia, Lavendel Felice och mer.",
    heading: "Lavendel",
    subheading: "Lavandula angustifolia och andra lavendelarter",
    category: "herb",
    emoji: "💜",
  },
  hydrangea: {
    title: "Hortensior – Prisöversikt | NordicBotanical",
    description: "Jämför priser på hortensior. Hydrangea macrophylla, Endless Summer och mer.",
    heading: "Hortensior",
    subheading: "Hydrangea – jämför priser hos nordiska butiker",
    category: "other",
    emoji: "💐",
  },
  palm: {
    title: "Palmer – Prisöversikt | NordicBotanical",
    description: "Jämför priser på palmer och tropiska växter hos nordiska växtbutiker.",
    heading: "Palmer",
    subheading: "Tropiska palmer för hem och trädgård",
    category: "palm",
    emoji: "🌴",
  },
  ferns: {
    title: "Ormbunkar – Prisöversikt | NordicBotanical",
    description: "Jämför priser på ormbunkar och ferns hos nordiska växtbutiker.",
    heading: "Ormbunkar",
    subheading: "Gröna ormbunkar för hem och trädgård",
    category: "fern",
    emoji: "🌿",
  },
};

const DEFAULT_META = (slug) => ({
  title: `${slug} – Jämför priser | NordicBotanical`,
  description: `Hitta bästa priset på ${slug} hos nordiska växtbutiker.`,
  heading: slug.charAt(0).toUpperCase() + slug.slice(1),
  subheading: "Jämför priser hos nordiska växtbutiker",
  category: null,
  emoji: "🌱",
});

export default function PlantCategoryPage() {
  const { category } = useParams();
  const meta = CATEGORY_META[category] || DEFAULT_META(category);
  const [products, setProducts] = useState([]);
  const [plants, setPlants] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      base44.entities.Product.list("-price", 50),
      base44.entities.Plant.list(),
      base44.entities.Seller.list(),
    ]).then(([prods, plantList, sellerList]) => {
      const sellersMap = Object.fromEntries(sellerList.map((s) => [s.id, s]));
      const plantsMap = Object.fromEntries(plantList.map((p) => [p.id, p]));

      // Filter by category if applicable
      let filtered = prods;
      if (meta.category) {
        const matchingPlantIds = new Set(
          plantList.filter((p) => p.category === meta.category).map((p) => p.id)
        );
        filtered = prods.filter((p) => !p.plant_id || matchingPlantIds.has(p.plant_id));
      }

      // Enrich products
      const enriched = filtered.map((p) => {
        const plant = plantsMap[p.plant_id] || {};
        const seller = sellersMap[p.seller_id] || {};
        return {
          ...p,
          name: p.product_title,
          latin_name: plant.scientific_name,
          seller_name: seller.seller_name,
          seller_country: seller.country,
        };
      }).filter((p) => p.price > 0).slice(0, 48);

      setProducts(enriched);
      setPlants(plantList.filter((p) => meta.category ? p.category === meta.category : true).slice(0, 20));
      setSellers(sellersMap);
      setLoading(false);
    });
  }, [category]);

  const bestPrice = products.length > 0 ? Math.min(...products.map((p) => (p.price || 0) + (p.shipping_cost || 0))) : 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": meta.heading,
    "description": meta.description,
    "url": `https://nordicbotanical.com/plants/${category}`,
    "itemListElement": products.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": p.name,
        "url": p.product_url,
        "image": p.image_url,
        "offers": {
          "@type": "Offer",
          "price": p.price,
          "priceCurrency": p.currency || "SEK",
          "availability": p.availability === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={meta.title}
        description={meta.description}
        url={`https://nordicbotanical.com/plants/${category}`}
        structuredData={structuredData}
      />
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Hem</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/plants" className="hover:text-foreground">Växter</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{meta.heading}</span>
          </nav>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/8 via-background to-background py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-4xl mb-3">{meta.emoji}</div>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-3">{meta.heading}</h1>
              <p className="text-muted-foreground max-w-xl">{meta.subheading}</p>
              {products.length > 0 && (
                <p className="text-sm text-primary font-medium mt-3">
                  {products.length} produkter · Från {bestPrice.toFixed(0)} kr
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Plant slugs for SEO */}
        {plants.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-wrap gap-2">
              {plants.map((p) => (
                <Link
                  key={p.id}
                  to={`/plant/${(p.scientific_name || p.plant_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {p.scientific_name ? <em>{p.scientific_name}</em> : p.plant_name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Leaf className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Inga produkter hittades i denna kategori ännu.</p>
              <Link to="/search" className="text-sm text-primary mt-3 inline-block hover:underline">Prova sökning →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p, i) => (
                <PlantCard
                  key={p.id}
                  plant={p}
                  index={i}
                  isBestPrice={(p.price || 0) + (p.shipping_cost || 0) === bestPrice}
                />
              ))}
            </div>
          )}
        </div>

        {/* SEO content block */}
        <div className="bg-muted/30 border-t border-border/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-sm prose-slate max-w-none">
            <h2 className="font-display text-2xl text-foreground">Om {meta.heading}</h2>
            <p className="text-muted-foreground">
              På NordicBotanical.com jämför vi priser på {meta.heading.toLowerCase()} från hundratals nordiska växtbutiker i Sverige, Norge, Danmark och Finland. Vi uppdaterar priser dagligen så att du alltid hittar det bästa erbjudandet.
            </p>
            <h3 className="font-display text-lg text-foreground mt-6">Hur vi jämför priser</h3>
            <p className="text-muted-foreground">
              Vår automatiska prisjämförelse samlar data från butiker som Plantagen, Blomsterlandet, Wexthuset och fler. Vi visar totalpriset inklusive frakt så att du kan jämföra rättvist.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}