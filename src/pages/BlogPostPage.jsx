import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Sprout, ArrowLeft } from "lucide-react";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    base44.entities.BlogPost
      .filter({ slug })
      .then((items) => {
        if (items && items.length) setPost(items[0]);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  if (notFound || !post)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Inlägget hittades inte.</p>
        <Link
          to="/blog"
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          Tillbaka till bloggen
        </Link>
      </div>
    );

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

      <article className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/blog"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Tillbaka till bloggen
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
            {post.category}
          </span>
          <span className="text-muted-foreground">{post.publishDate}</span>
        </div>

        <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{post.metaDescription}</p>

        <div className="prose prose-sm mt-8 max-w-none text-foreground">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="mt-8 text-xl font-semibold text-foreground">{children}</h2>
              ),
              p: ({ children }) => (
                <p className="mt-3 leading-relaxed text-muted-foreground">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}