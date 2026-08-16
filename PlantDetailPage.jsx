import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/seo/SEOHead";
import PlantCard from "@/components/search/PlantCard";
import { motion } from "framer-motion";
import { ChevronRight, Leaf, Droplets, Sun, Thermometer, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function PlantDetailPage() {
  const { slug } = useParams(); // route: /plant/:slug
  const [plant, setPlant] = useState(null);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [careGuide, setCareGuide] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      base44.entities.Plant.list(),
      base44.entities.Product.list(),
      base44.entities.Seller.list(),
    ]).then(async ([plants, prods, sellerList]) => {
      const sellersMap = Object.fromEntries(sellerList.map((s) => [s.id, s]));

      // Find plant by slug matching scientific or common name
      const found = plants.find(
        (p) => slugify(p.scientific_name) === slug || slugify(p.plant_name) === slug
      );

      if (found) {
        setPlant(found);
        const relatedProducts = prods
          .filter((p) => p.plant_id === found.id)
          .map((p) => ({
            ...p,
            name: p.product_title,
            latin_name: found.scientific_name,
            seller_name: sellersMap[p.seller_id]?.seller_name,
            seller_country: sellersMap[p.seller_id]?.country,
          }))
          .sort((a, b) => (a.price || 999) - (b.price || 999));
        setProducts(relatedProducts);
        setSellers(sellersMap);

        // Generate care guide with AI
        const guide = await base44.integrations.Core.InvokeLLM({
          prompt: `Write a concise plant care guide for "${found.plant_name}" (${found.scientific_name || "unknown species"}) in Swedish.

Return JSON with these fields:
- watering: short description (1 sentence)
- light: short description (1 sentence)
- temperature: ideal temp range in Celsius
- difficulty: "Lätt", "Medel", or "Avancerad"
- fun_fact: one interesting fact in Swedish

Keep each field under 20 words.`,
          response_json_schema: {
            type: "object",
            properties: {
              watering: { type: "string" },
              light: { type: "string" },
              temperature: { type: "string" },
              difficulty: { type: "string" },
              fun_fact: { type: "string" },
            },
          },
        });
        setCareGuide(guide);
      }
      setLoading(false);
    });
  }, [slug]);

  const bestTotalPrice = products.length
    ? Math.min(...products.map((p) => (p.price || 0) + (p.shipping_cost || 0)))
    : 0;

  const structuredData = plant ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": plant.plant_name,
    "description": plant.description || `Jämför priser på ${plant.plant_name}`,
    "image": products[0]?.image_url || "",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": bestTotalPrice,
      "priceCurrency": "SEK",
      "offerCount": products.length,
      "offers": products.slice(0, 5).map((p) => ({
        "@type": "Offer",
        "price": p.price,
        "priceCurrency": p.currency || "SEK",
        "url": p.product_url,
        "availability": p.availability === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      })),
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://nordicbotanical.com" },
        { "@type": "ListItem", "position": 2, "name": "Växter", "item": "https://nordicbotanical.com/plants" },
        { "@type": "ListItem", "position": 3, "name": plant.plant_name },
      ],
    },
  } : null;

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!plant) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Växten hittades inte.</p>
          <Link to="/plants" className="text-sm text-primary mt-3 inline-block hover:underline">← Alla växter</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={`${plant.plant_name} – Jämför priser | NordicBotanical`}
        description={`Jämför priser på ${plant.plant_name} (${plant.scientific_name || ""}) hos nordiska växtbutiker. Från ${bestTotalPrice.toFixed(0)} kr.`}
        url={`https://nordicbotanical.com/plants/${slug}`}
        image={products[0]?.image_url}
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
            <span className="text-foreground">{plant.plant_name}</span>
          </nav>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Plant header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="flex-1">
                <h1 className="font-display text-4xl sm:text-5xl text-foreground">{plant.plant_name}</h1>
                {plant.scientific_name && (
                  <p className="text-lg text-muted-foreground italic mt-1">{plant.scientific_name}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {plant.category && (
                    <Badge variant="secondary" className="rounded-lg capitalize">{plant.category}</Badge>
                  )}
                  {products.length > 0 && (
                    <Badge className="bg-primary/10 text-primary border-0 rounded-lg flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Från {bestTotalPrice.toFixed(0)} kr
                    </Badge>
                  )}
                </div>
              </div>
              {products[0]?.image_url && (
                <div className="w-full sm:w-48 h-40 rounded-2xl overflow-hidden shrink-0">
                  <img src={products[0].image_url} alt={plant.plant_name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {plant.description && (
              <p className="text-muted-foreground max-w-2xl">{plant.description}</p>
            )}
          </motion.div>

          {/* Care guide */}
          {careGuide && (
            <div className="bg-card rounded-2xl border border-border/60 p-6 mb-10">
              <h2 className="font-display text-xl text-foreground mb-4">Skötselguide</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-foreground">Vattning</div>
                  <div className="text-xs text-muted-foreground mt-1">{careGuide.watering}</div>
                </div>
                <div className="text-center">
                  <Sun className="w-5 h-5 text-yellow-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-foreground">Ljus</div>
                  <div className="text-xs text-muted-foreground mt-1">{careGuide.light}</div>
                </div>
                <div className="text-center">
                  <Thermometer className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-foreground">Temperatur</div>
                  <div className="text-xs text-muted-foreground mt-1">{careGuide.temperature}</div>
                </div>
                <div className="text-center">
                  <Leaf className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-foreground">Svårighetsgrad</div>
                  <div className="text-xs text-muted-foreground mt-1">{careGuide.difficulty}</div>
                </div>
              </div>
              {careGuide.fun_fact && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-4 py-2.5 italic">
                  💡 {careGuide.fun_fact}
                </p>
              )}
            </div>
          )}

          {/* Price comparison */}
          <h2 className="font-display text-2xl text-foreground mb-5">Prisjämförelse</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border/60">
              <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Inga butiker säljer denna växt just nu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p, i) => (
                <PlantCard
                  key={p.id} plant={p} index={i}
                  isBestPrice={(p.price || 0) + (p.shipping_cost || 0) === bestTotalPrice}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}