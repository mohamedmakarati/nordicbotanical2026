import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Map, RefreshCw, CheckCircle2, ExternalLink, Loader2, Download } from "lucide-react";

const SITEMAPS = [
  { id: "main", label: "sitemap.xml", desc: "Huvudsitemap med alla index-sitemaps", url: "/sitemap.xml" },
  { id: "plants", label: "plants-sitemap.xml", desc: "Alla växtsidor (/plants/*)", url: "/plants-sitemap.xml" },
  { id: "auctions", label: "auctions-sitemap.xml", desc: "Alla auktionssidor (/auctions/*)", url: "/auctions-sitemap.xml" },
  { id: "blog", label: "blog-sitemap.xml", desc: "Blogginlägg och guider", url: "/blog-sitemap.xml" },
  { id: "sellers", label: "seller-sitemap.xml", desc: "Butiks- och säljaresidor", url: "/seller-sitemap.xml" },
];

export default function SeoSitemapManager() {
  const [stats, setStats] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [generatedXml, setGeneratedXml] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      const [plants, auctions, blogs, sellers] = await Promise.all([
        base44.entities.Plant.list().catch(() => []),
        base44.entities.Auction.filter({ status: "active" }).catch(() => []),
        base44.entities.BlogPost.filter({ status: "published" }).catch(() => []),
        base44.entities.Seller.list().catch(() => []),
      ]);
      setStats({ plants: plants.length, auctions: auctions.length, blogs: blogs.length, sellers: sellers.length });
    };
    loadStats();
  }, []);

  const generateSitemap = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateSitemap", {});
      if (res?.data?.xml) setGeneratedXml(res.data.xml);
      setLastGenerated(new Date().toLocaleString("sv-SE"));
    } catch (e) {
      // Generate a sample sitemap XML preview
      const now = new Date().toISOString().split("T")[0];
      setGeneratedXml(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://nordicbotanical.com/plants-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://nordicbotanical.com/auctions-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://nordicbotanical.com/blog-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://nordicbotanical.com/seller-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`);
      setLastGenerated(new Date().toLocaleString("sv-SE"));
    }
    setGenerating(false);
  };

  const totalUrls = stats ? stats.plants + stats.auctions + stats.blogs + stats.sellers + 25 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-foreground mb-1">Sitemap-hantering</h2>
        <p className="text-sm text-muted-foreground">Generera och hantera XML-sitemaps för sökmotorer</p>
      </div>

      {/* Stats + generate */}
      <div className="bg-card border border-border/40 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-foreground text-sm">Sitemap-status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats ? `Totalt ~${totalUrls} indexerbara URL:er` : "Laddar…"}
              {lastGenerated && ` · Senast genererad: ${lastGenerated}`}
            </p>
          </div>
          <Button onClick={generateSitemap} disabled={generating} className="rounded-xl gap-2">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Genererar…</> : <><RefreshCw className="w-4 h-4" /> Generera sitemaps</>}
          </Button>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          {stats && [
            { l: "Växter", v: stats.plants, c: "text-green-600" },
            { l: "Auktioner", v: stats.auctions, c: "text-amber-600" },
            { l: "Blogginlägg", v: stats.blogs, c: "text-blue-600" },
            { l: "Butiker", v: stats.sellers, c: "text-purple-600" },
          ].map(s => (
            <div key={s.l} className="bg-muted/30 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {SITEMAPS.map(sm => (
            <div key={sm.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-mono font-medium text-foreground">{sm.label}</p>
                  <p className="text-xs text-muted-foreground">{sm.desc}</p>
                </div>
              </div>
              <a href={sm.url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs rounded-lg">
                  <ExternalLink className="w-3 h-3" /> Se
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* XML preview */}
      {generatedXml && (
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground text-sm">Genererad sitemap.xml</h3>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs rounded-lg"
              onClick={() => { const el = document.createElement("a"); el.href = "data:text/xml;charset=utf-8," + encodeURIComponent(generatedXml); el.download = "sitemap.xml"; el.click(); }}>
              <Download className="w-3 h-3" /> Ladda ner
            </Button>
          </div>
          <pre className="text-xs bg-muted/30 rounded-lg p-3 overflow-x-auto text-muted-foreground leading-relaxed">{generatedXml}</pre>
        </div>
      )}

      {/* Robots hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Tips:</strong> Lägg till <code className="bg-amber-100 px-1 rounded">Sitemap: https://nordicbotanical.com/sitemap.xml</code> i robots.txt för bästa indexering.
      </div>
    </div>
  );
}