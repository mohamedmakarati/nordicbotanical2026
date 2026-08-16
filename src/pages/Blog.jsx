import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sprout, ArrowRight } from "lucide-react";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost
      .list("-publishDate", 50)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
            Nordic Botanical
          </Link>
          <nav className="ml-6 hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground">Växter</Link>
            <Link to="/blog" className="text-foreground">Blogg</Link>
            <Link to="/marketing" className="hover:text-foreground">Marknadsföring</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <h1 className="text-3xl font-bold md:text-4xl">Växtbloggen</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Skötselguider, växttips och växtnytt — allt om växter för Sverige.
        </p>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">Inga blogginlägg ännu.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group rounded-2xl border p-6 transition hover:border-primary/40"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                    {p.category}
                  </span>
                  <span className="text-muted-foreground">{p.publishDate}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold group-hover:text-primary">
                  {p.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {p.metaDescription}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Läs mer <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}