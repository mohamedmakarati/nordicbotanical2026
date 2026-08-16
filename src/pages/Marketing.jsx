import React from "react";
import { Link } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Sprout, FileText, Share2, Mail, Newspaper, Image, Store, CheckSquare } from "lucide-react";
import {
  planMeta,
  blogPosts,
  socialPosts,
  outreachEmails,
  newsletters,
  pinterestPins,
  gbpPosts,
  checklist,
} from "@/data/marketingPlan";

function SectionHeader({ title, count }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {count != null && (
        <span className="text-sm text-muted-foreground">{count} objekt</span>
      )}
    </div>
  );
}

export default function Marketing() {
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
            <Link to="/blog" className="hover:text-foreground">Blogg</Link>
            <Link to="/marketing" className="text-foreground">Marknadsföring</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
          Vecka {planMeta.week}
        </div>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Marknadsföringsplan</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {planMeta.period} — {planMeta.goal}
        </p>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <Tabs defaultValue="blog" className="w-full">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="blog" className="gap-1.5"><FileText className="h-4 w-4" /> Blogg</TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5"><Share2 className="h-4 w-4" /> Sociala medier</TabsTrigger>
            <TabsTrigger value="outreach" className="gap-1.5"><Mail className="h-4 w-4" /> Outreach</TabsTrigger>
            <TabsTrigger value="newsletter" className="gap-1.5"><Newspaper className="h-4 w-4" /> Nyhetsbrev</TabsTrigger>
            <TabsTrigger value="pinterest" className="gap-1.5"><Image className="h-4 w-4" /> Pinterest</TabsTrigger>
            <TabsTrigger value="gbp" className="gap-1.5"><Store className="h-4 w-4" /> GBP</TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5"><CheckSquare className="h-4 w-4" /> Checklista</TabsTrigger>
          </TabsList>

          {/* Blog */}
          <TabsContent value="blog" className="mt-6">
            <SectionHeader title="SEO-blogginlägg (5/vecka)" count={blogPosts.length} />
            <div className="grid gap-4 md:grid-cols-2">
              {blogPosts.map((p) => (
                <div key={p.url} className="rounded-xl border p-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{p.category}</span>
                    <span className="text-muted-foreground">{p.date}</span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">Nyckelord: {p.keyword}</p>
                  <Link to={p.url} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                    Öppna inlägg →
                  </Link>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Social */}
          <TabsContent value="social" className="mt-6">
            <SectionHeader title="Sociala medier (10/vecka)" count={socialPosts.length} />
            <div className="grid gap-4 md:grid-cols-2">
              {socialPosts.map((s, i) => (
                <div key={i} className="rounded-xl border p-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">{s.platform}</span>
                    <span className="text-muted-foreground">{s.day}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{s.caption}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Outreach */}
          <TabsContent value="outreach" className="mt-6">
            <SectionHeader title="Backlink-outreach (5/vecka)" count={outreachEmails.length} />
            <div className="space-y-3">
              {outreachEmails.map((e, i) => (
                <div key={i} className="rounded-xl border p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium">{e.subject}</h3>
                    <span className="text-xs text-muted-foreground">{e.target}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Ankartext: {e.anchor}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Newsletter */}
          <TabsContent value="newsletter" className="mt-6">
            <SectionHeader title="Nyhetsbrev (3/vecka)" count={newsletters.length} />
            <div className="grid gap-4 md:grid-cols-3">
              {newsletters.map((n, i) => (
                <div key={i} className="rounded-xl border p-5">
                  <div className="text-xs text-muted-foreground">{n.day}</div>
                  <h3 className="mt-1 font-semibold">{n.name}</h3>
                  <p className="mt-2 text-sm font-medium">{n.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tema: {n.theme}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Pinterest */}
          <TabsContent value="pinterest" className="mt-6">
            <SectionHeader title="Pinterest-pinnar (10/vecka)" count={pinterestPins.length} />
            <div className="grid gap-3 md:grid-cols-2">
              {pinterestPins.map((t, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border p-4">
                  <Image className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* GBP */}
          <TabsContent value="gbp" className="mt-6">
            <SectionHeader title="Google Business Profile (5/vecka)" count={gbpPosts.length} />
            <div className="space-y-3">
              {gbpPosts.map((g, i) => (
                <div key={i} className="rounded-xl border p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{g.title}</h3>
                    <span className="text-xs text-muted-foreground">{g.day} · {g.type}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Checklist */}
          <TabsContent value="checklist" className="mt-6">
            <SectionHeader title="Vecko-checklista" />
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="mb-3 font-semibold">Dagliga uppgifter</h3>
                <ul className="space-y-2">
                  {checklist.daily.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm">
                      <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2">
                <h3 className="mb-3 font-semibold">Publiceringschema</h3>
                <div className="space-y-2">
                  {checklist.schedule.map((s) => (
                    <div key={s.day} className="flex flex-col rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4">
                      <span className="w-24 shrink-0 font-medium">{s.day}</span>
                      <span className="text-sm text-muted-foreground">{s.tasks}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="mb-3 mt-8 font-semibold">Mål att följa</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {checklist.metrics.map((m) => (
                <div key={m.label} className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="mt-1 font-semibold text-primary">{m.target}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}