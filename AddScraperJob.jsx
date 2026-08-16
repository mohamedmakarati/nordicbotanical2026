import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

const SELLER_CATEGORIES = [
  { value: "plant_shop", label: "Växtbutik" },
  { value: "nursery", label: "Plantskola" },
  { value: "wholesaler", label: "Grossist" },
  { value: "garden_center", label: "Trädgårdscenter" },
];

const SCRAPE_TYPES = [
  { value: "single_page", label: "Enstaka sida" },
  { value: "category_page", label: "Kategorisida" },
  { value: "full_website", label: "Hela webbplatsen" },
];

export default function AddScraperJob({ onJobCreated }) {
  const [form, setForm] = useState({
    website_url: "",
    seller_name: "",
    seller_category: "plant_shop",
    scrape_type: "category_page",
    language: "swedish",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Create the job
    const job = await base44.entities.ScraperJob.create({
      ...form,
      country: "Sweden",
      status: "pending",
    });

    // Run the scraper
    const res = await base44.functions.invoke("aiWebsiteScraper", { job_id: job.id });

    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setResult(res.data);
      onJobCreated?.();
    }
    setLoading(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6">
      <h3 className="font-display text-lg text-foreground mb-5 flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" /> Lägg till webbplats att skrapa
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Webbadress (URL) *</Label>
            <Input
              placeholder="https://www.example.se/vaxter/"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Butiksnamn *</Label>
            <Input
              placeholder="Exempel Växter"
              value={form.seller_name}
              onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Butikstyp</Label>
            <select
              value={form.seller_category}
              onChange={(e) => setForm({ ...form, seller_category: e.target.value })}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {SELLER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Skrapningstyp</Label>
            <select
              value={form.scrape_type}
              onChange={(e) => setForm({ ...form, scrape_type: e.target.value })}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {SCRAPE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Språk</Label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="swedish">Svenska</option>
              <option value="english">Engelska</option>
            </select>
          </div>
        </div>

        <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
          <p>🤖 AI skannar sidan och extraherar växtprodukter automatiskt</p>
          <p>🔒 Respekterar robots.txt · Fördröjning mellan förfrågningar</p>
          <p>✅ Alla produkter kräver admingodkännande innan publicering</p>
          <p>🇸🇪 Endast svenska marknaden · Valuta SEK</p>
        </div>

        <Button type="submit" disabled={loading} className="w-full rounded-xl gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Skannar... (kan ta 30-60s)</> : <><Globe className="w-4 h-4" /> Starta AI-skrapning</>}
        </Button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Skrapning misslyckades</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-foreground">Skrapning klar!</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-background rounded-xl p-3">
              <div className="font-display text-2xl text-foreground">{result.products_found ?? 0}</div>
              <div className="text-xs text-muted-foreground">Produkter hittade</div>
            </div>
            <div className="bg-background rounded-xl p-3">
              <div className="font-display text-2xl text-foreground capitalize">{result.status?.replace("_", " ")}</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Granska produkterna under fliken "Väntar på granskning"
          </p>
        </div>
      )}
    </div>
  );
}