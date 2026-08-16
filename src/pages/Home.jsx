import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Sprout, Leaf } from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [light, setLight] = useState("all");
  const [water, setWater] = useState("all");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    base44.entities.Product.list("-created_date", 200)
      .then((items) => {
        setProducts(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const lightOptions = useMemo(() => {
    const s = new Set();
    products.forEach((p) => p["Ljusbehov"] && s.add(p["Ljusbehov"]));
    return [...s].sort();
  }, [products]);

  const waterOptions = useMemo(() => {
    const s = new Set();
    products.forEach((p) => p["Vattenbehov"] && s.add(p["Vattenbehov"]));
    return [...s].sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (
        search &&
        !(p["Produktnamn"] || "").toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (light !== "all" && p["Ljusbehov"] !== light) return false;
      if (water !== "all" && p["Vattenbehov"] !== water) return false;
      return true;
    });
    list = [...list];
    if (sort === "price-asc")
      list.sort((a, b) => (a["Pris (SEK)"] || 0) - (b["Pris (SEK)"] || 0));
    else if (sort === "price-desc")
      list.sort((a, b) => (b["Pris (SEK)"] || 0) - (a["Pris (SEK)"] || 0));
    else
      list.sort((a, b) =>
        (a["Produktnamn"] || "").localeCompare(b["Produktnamn"] || "", "sv")
      );
    return list;
  }, [products, search, light, water, sort]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            Nordic Botanical
          </div>
          <nav className="ml-6 hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="text-foreground">Växter</Link>
            <Link to="/blog" className="hover:text-foreground">Blogg</Link>
            <Link to="/marketing" className="hover:text-foreground">Marknadsföring</Link>
          </nav>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök växter..."
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            <Leaf className="h-4 w-4" /> Färska växter direkt hem till dig
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Hitta din nästa gröna favorit
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Utforska vårt utbud av inomhusväxter med vårdtips för ljus och vatten
            — noggrant utvalt för ditt hem.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Select value={light} onValueChange={setLight}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ljusbehov" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla ljusbehov</SelectItem>
              {lightOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={water} onValueChange={setWater}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Vattenbehov" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla vattenbehov</SelectItem>
              {waterOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sortera: Namn</SelectItem>
              <SelectItem value="price-asc">Pris: Lågt till högt</SelectItem>
              <SelectItem value="price-desc">Pris: Högt till lågt</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} växter
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            Inga växter matchar din sökning.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
          <Sprout className="h-4 w-4" /> Nordic Botanical — växter för hemmet
        </div>
      </footer>
    </div>
  );
}