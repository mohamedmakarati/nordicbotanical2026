import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Leaf, Clock, ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const CATEGORY_LABELS = {
  "skötselguide": "Skötselguide",
  "odlingstips": "Odlingstips",
  "nyheter": "Nyheter",
  "auktioner": "Auktioner",
  "sällsynta-växter": "Sällsynta växter",
  "säsong": "Säsong",
};

const PLACEHOLDER_POSTS = [
  {
    id: "1", title: "5 bästa tropiska växter för svenska hem", slug: "tropiska-vaxter-svenska-hem",
    excerpt: "Vi reder ut vilka tropiska växter som trivs bäst inomhus i Sverige — och var du hittar dem billigast.",
    category: "skötselguide", author_name: "Nordic Botanical",
    published_at: new Date().toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=350&fit=crop",
  },
  {
    id: "2", title: "Vårens bästa växtauktioner — vad ska du buda på?", slug: "varens-auktioner",
    excerpt: "Säsongens mest eftertraktade växter på auktion: rare monstera, japanska lönnar och mer.",
    category: "auktioner", author_name: "Nordic Botanical",
    published_at: new Date().toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&h=350&fit=crop",
  },
  {
    id: "3", title: "Hur identifierar du en sjuk växt med AI?", slug: "ai-vaxtidentifiering",
    excerpt: "Vår AI-funktion kan analysera din växts symptom och ge skötselråd på sekunder.",
    category: "nyheter", author_name: "Nordic Botanical",
    published_at: new Date().toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=600&h=350&fit=crop",
  },
  {
    id: "4", title: "Odla olivträd i Sverige — är det möjligt?", slug: "olivtrad-sverige",
    excerpt: "Olivträd kan trivas i Sverige med rätt skötsel. Här är guiden till framgång.",
    category: "odlingstips", author_name: "Nordic Botanical",
    published_at: new Date().toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&h=350&fit=crop",
  },
  {
    id: "5", title: "Sällsynta växter som ökar i värde", slug: "sallsynta-vaxter-varde",
    excerpt: "Monstera Variegata, Philodendron gloriosum och fler — dessa växter är investeringar.",
    category: "sällsynta-växter", author_name: "Nordic Botanical",
    published_at: new Date().toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=350&fit=crop",
  },
  {
    id: "6", title: "Höstplantering — vilka perenner är bäst?", slug: "hostplantering-perenner",
    excerpt: "Höst är perfekt tid att plantera perenner. Vi tipsar om bästa arterna för Sverige.",
    category: "säsong", author_name: "Nordic Botanical",
    published_at: new Date().toISOString(),
    cover_image_url: "https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=600&h=350&fit=crop",
  },
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ status: "published" }, "-published_at", 50)
      .then((data) => { setPosts(data.length ? data : PLACEHOLDER_POSTS); setLoading(false); })
      .catch(() => { setPosts(PLACEHOLDER_POSTS); setLoading(false); });
  }, []);

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchQ = !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.excerpt?.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const featured = filtered.find((p) => p.featured) || filtered[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <span className="text-xs font-medium text-primary tracking-widest uppercase">Blogg & Guider</span>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mt-3 mb-3">Växtkunskap</h1>
            <p className="text-muted-foreground text-base max-w-xl">
              Skötselguider, odlingstips, nyheter och allt om sällsynta växter i Norden.
            </p>
          </motion.div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök artiklar..."
                className="w-full pl-9 pr-4 h-9 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", ...Object.keys(CATEGORY_LABELS)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border/60 hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "Alla" : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Inga artiklar hittades.</p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <Link to={`/blog/${featured.slug}`} className="group flex flex-col sm:flex-row gap-6 bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/25 hover:shadow-md transition-all duration-300">
                    {featured.cover_image_url && (
                      <div className="sm:w-2/5 aspect-video sm:aspect-auto overflow-hidden">
                        <img src={featured.cover_image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
                      <Badge variant="secondary" className="w-fit rounded-lg text-xs mb-3">
                        {CATEGORY_LABELS[featured.category] || featured.category}
                      </Badge>
                      <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3 leading-tight">{featured.title}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{featured.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{featured.author_name}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(featured.published_at || featured.created_date), "d MMM yyyy")}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Link to={`/blog/${post.slug}`} className="group flex flex-col bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/25 hover:shadow-md transition-all duration-300 h-full">
                      {post.cover_image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="flex-1 p-5 flex flex-col">
                        <Badge variant="secondary" className="w-fit rounded-lg text-[10px] mb-2">
                          {CATEGORY_LABELS[post.category] || post.category}
                        </Badge>
                        <h3 className="font-display text-base text-foreground mb-2 leading-snug flex-1">{post.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-auto">
                          <Clock className="w-3 h-3" />
                          {format(new Date(post.published_at || post.created_date), "d MMM yyyy")}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}