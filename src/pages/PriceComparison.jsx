import { useState } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Plus, X, ExternalLink, TrendingDown, Sparkles, ShoppingCart, Info } from "lucide-react";

const SWEDISH_SELLERS = [
  { name: "Impecta", url: "https://www.impecta.se" },
  { name: "Blomsterlandet", url: "https://www.blomsterlandet.se" },
  { name: "Plantagen", url: "https://www.plantagen.se" },
  { name: "Rusta", url: "https://www.rusta.com/sv-se" },
  { name: "Horto", url: "https://www.horto.se" },
];

function availabilityLabel(a) {
  if (a === "in_stock") return { label: "I lager", color: "bg-green-100 text-green-700" };
  if (a === "out_of_stock") return { label: "Slutsåld", color: "bg-red-100 text-red-700" };
  if (a === "limited") return { label: "Begränsat", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Okänd", color: "bg-gray-100 text-gray-600" };
}

function DiscountBadge({ price, regularPrice }) {
  if (!regularPrice || regularPrice <= price) return null;
  const pct = Math.round((1 - price / regularPrice) * 100);
  return (
    <span className="inline-block bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
      -{pct}%
    </span>
  );
}

function ProductCard({ product, rank }) {
  const avail = availabilityLabel(product.availability);
  const discount = product.regular_price && product.regular_price > product.price
    ? Math.round((1 - product.price / product.regular_price) * 100)
    : null;
  const isLive = product.source === "live";

  return (
    <div className={`bg-white rounded-2xl border ${rank === 0 ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border/60"} overflow-hidden hover:shadow-md transition-all`}>
      {rank === 0 && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5" /> Bästa pris
        </div>
      )}
      <div className="p-4">
        <div className="flex gap-3">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_title} className="w-16 h-16 object-contain rounded-xl bg-muted/30 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-muted/40 shrink-0 flex items-center justify-center text-2xl">🌿</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground leading-tight line-clamp-2">{product.product_title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.seller_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${avail.color}`}>{avail.label}</span>
              {isLive && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">Live</span>}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{product.price?.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">SEK</span></span>
              {discount && <DiscountBadge price={product.price} regularPrice={product.regular_price} />}
            </div>
            {product.regular_price && product.regular_price > product.price && (
              <p className="text-xs text-muted-foreground line-through">{product.regular_price?.toFixed(0)} SEK</p>
            )}
            {product.shipping_cost > 0 && (
              <p className="text-xs text-muted-foreground">+{product.shipping_cost} SEK frakt</p>
            )}
            {product.shipping_cost === 0 && product.price && (
              <p className="text-xs text-green-600">Fri frakt</p>
            )}
          </div>
          {product.product_url && product.product_url !== "#" && (
            <a href={product.product_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="rounded-xl gap-1.5 text-xs h-8">
                <ShoppingCart className="w-3 h-3" /> Köp
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PriceComparison() {
  const [query, setQuery] = useState("");
  const [customUrls, setCustomUrls] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const addUrl = () => {
    const u = urlInput.trim();
    if (u && !customUrls.includes(u)) {
      setCustomUrls([...customUrls, u]);
      setUrlInput("");
    }
  };

  const removeUrl = (url) => setCustomUrls(customUrls.filter(u => u !== url));

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    const res = await base44.functions.invoke("aiPriceComparison", {
      query: query.trim(),
      seller_urls: customUrls,
    });
    setResults(res.data);
    setLoading(false);
  };

  const analysis = results?.ai_analysis;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> AI Prisjämförelse
          </div>
          <h1 className="font-display text-4xl text-foreground mb-3">Hitta bästa växtpriset</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Jämför priser i realtid från svenska växtbutiker och växthus. Klistra in butikens URL för live-kontroll av aktuellt pris.
          </p>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 rounded-xl h-11"
                placeholder="Sök växt eller produkt, t.ex. 'Monstera', 'Tomat', 'Dahlia'..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()} className="rounded-xl h-11 px-6 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Jämför
            </Button>
          </div>

          {/* URL input for live checking */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Klistra in specifika butiks-URL:er för live-priskontroll (valfritt)
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                className="rounded-xl h-9 text-sm flex-1"
                placeholder="https://www.butiken.se/produkt/monstera-deliciosa"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addUrl()}
              />
              <Button variant="outline" size="sm" onClick={addUrl} className="rounded-xl h-9 gap-1">
                <Plus className="w-3.5 h-3.5" /> Lägg till
              </Button>
            </div>

            {/* Quick-add known sellers */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SWEDISH_SELLERS.map(s => (
                <button
                  key={s.name}
                  onClick={() => { if (!customUrls.find(u => u.startsWith(s.url))) setCustomUrls([...customUrls, s.url]); }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors"
                >
                  + {s.name}
                </button>
              ))}
            </div>

            {customUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customUrls.map(url => (
                  <div key={url} className="flex items-center gap-1 bg-accent/60 rounded-lg px-2.5 py-1 text-xs text-accent-foreground max-w-xs">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{url.replace("https://", "").replace("www.", "")}</span>
                    <button onClick={() => removeUrl(url)} className="ml-1 hover:text-destructive shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">AI analyserar priser från svenska butiker...</p>
            <p className="text-xs text-muted-foreground mt-1">Kontrollerar databas och live-webbplatser</p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6">

            {/* AI Analysis card */}
            {analysis && (
              <div className="bg-gradient-to-br from-primary/5 to-accent/30 rounded-2xl border border-primary/20 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">AI-analys</h2>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {results.total_results} resultat
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-3">{analysis.summary}</p>
                {analysis.best_deal && (
                  <div className="bg-white/70 rounded-xl p-3 mb-3 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Bästa erbjudande</p>
                    <p className="text-sm text-foreground">{analysis.best_deal}</p>
                  </div>
                )}
                {analysis.price_range && (
                  <div className="flex gap-4 mb-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Lägsta</span><br /><span className="font-bold text-green-700">{analysis.price_range.min?.toFixed(0)} SEK</span></div>
                    <div><span className="text-muted-foreground text-xs">Högsta</span><br /><span className="font-bold text-red-600">{analysis.price_range.max?.toFixed(0)} SEK</span></div>
                    <div><span className="text-muted-foreground text-xs">Medel</span><br /><span className="font-bold text-foreground">{analysis.price_range.avg?.toFixed(0)} SEK</span></div>
                  </div>
                )}
                {analysis.recommendation && (
                  <p className="text-xs text-muted-foreground italic">{analysis.recommendation}</p>
                )}
                {analysis.insights?.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {analysis.insights.map((ins, i) => (
                      <li key={i} className="text-xs text-foreground flex gap-1.5"><span className="text-primary">•</span>{ins}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Products grid */}
            {results.results?.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">
                    Prisjämförelse ({results.results.length} resultat)
                  </h2>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {results.db_results > 0 && <span className="bg-muted px-2 py-0.5 rounded-md">{results.db_results} från databas</span>}
                    {results.live_results > 0 && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{results.live_results} live</span>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.results.map((product, i) => (
                    <ProductCard key={i} product={product} rank={i} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">Inga resultat hittades</p>
                <p className="text-sm">Prova ett annat sökord eller lägg till butiks-URL:er ovan.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!results && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-6xl mb-4">🌿</div>
            <p className="font-medium mb-1">Sök efter en växt eller produkt</p>
            <p className="text-sm">AI jämför priser från svenska butiker direkt</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}