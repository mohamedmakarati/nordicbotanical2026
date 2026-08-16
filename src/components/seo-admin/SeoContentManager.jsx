import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles, Loader2, Edit2, Eye, Trash2, FileText, CheckCircle2, Clock } from "lucide-react";

const CATEGORIES = [
  { v: "skötselguide", l: "Skötselguide" },
  { v: "odlingstips", l: "Odlingstips" },
  { v: "auktioner", l: "Auktioner" },
  { v: "sällsynta-växter", l: "Sällsynta växter" },
  { v: "nyheter", l: "Nyheter" },
  { v: "säsong", l: "Säsong" },
];

const CONTENT_TYPES = [
  { id: "blog", l: "Blogginlägg" },
  { id: "plant_guide", l: "Växtguide" },
  { id: "growing_guide", l: "Odlingsguide" },
  { id: "auction_guide", l: "Auktionsguide" },
  { id: "seller_guide", l: "Säljarguide" },
];

export default function SeoContentManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | create
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "odlingstips", contentType: "blog", keyword: "", status: "draft" });

  useEffect(() => {
    base44.entities.BlogPost.list("-created_date", 30).then(d => { setPosts(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const generateContent = async () => {
    if (!form.keyword && !form.title) return;
    setGenerating(true);
    const topic = form.keyword || form.title;
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a complete SEO blog article in Swedish for NordicBotanical.com about "${topic}".
Content type: ${form.contentType}
Category: ${form.category}

Structure:
- Title (H1)
- Excerpt (2 sentences)  
- Full article (600-900 words, with H2 subheadings, practical tips, and internal link suggestions)

Return JSON: { "title": "...", "slug": "...", "excerpt": "...", "content": "..." (markdown format) }`,
      response_json_schema: {
        type: "object",
        properties: { title: { type: "string" }, slug: { type: "string" }, excerpt: { type: "string" }, content: { type: "string" } }
      }
    });
    if (res) {
      setForm(p => ({ ...p, title: res.title || p.title, slug: res.slug || p.slug, excerpt: res.excerpt || p.excerpt, content: res.content || p.content }));
    }
    setGenerating(false);
  };

  const save = async () => {
    await base44.entities.BlogPost.create({
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-"),
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      status: form.status,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    });
    setPosts(prev => [{ ...form, id: Date.now() }, ...prev]);
    setView("list");
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await base44.entities.BlogPost.update(post.id, { status: newStatus, published_at: newStatus === "published" ? new Date().toISOString() : null });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
  };

  const deletePost = async (id) => {
    if (!confirm("Ta bort detta inlägg?")) return;
    await base44.entities.BlogPost.delete(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  if (view === "create") return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground mb-1">Nytt innehåll</h2>
          <p className="text-sm text-muted-foreground">Skapa artikel eller guide med AI-hjälp</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => setView("list")}>← Tillbaka</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Titel</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Artikel-rubrik…" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Utkast</SelectItem>
                    <SelectItem value="published">Publicerad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="artikel-slug" className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Ingress</Label>
              <Textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={2} placeholder="Kort sammanfattning…" />
            </div>
            <div className="space-y-1.5">
              <Label>Innehåll (Markdown)</Label>
              <Textarea value={form.content} onChange={e => set("content", e.target.value)} rows={14} className="font-mono text-xs" placeholder="Skriv eller generera innehåll…" />
            </div>
            <Button onClick={save} disabled={!form.title} className="rounded-xl gap-2 w-full">
              <Plus className="w-4 h-4" /> Spara {form.status === "published" ? "& publicera" : "utkast"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI-assistent</h3>
            <div className="space-y-1.5">
              <Label>Nyckelord för artikel</Label>
              <Input value={form.keyword} onChange={e => set("keyword", e.target.value)} placeholder="t.ex. sköta monstera" />
            </div>
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select value={form.contentType} onValueChange={v => set("contentType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={generateContent} disabled={generating || (!form.keyword && !form.title)} className="w-full rounded-xl gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Genererar…</> : <><Sparkles className="w-4 h-4" /> Generera med AI</>}
            </Button>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-4 space-y-1.5">
            <Label>Kategori</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground mb-1">Innehållshantering</h2>
          <p className="text-sm text-muted-foreground">Artiklar, guider och blogginlägg</p>
        </div>
        <Button onClick={() => setView("create")} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Ny artikel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card border border-border/40 rounded-xl">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Inga artiklar ännu</p>
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          <div className="divide-y divide-border/20">
            {posts.map(post => (
              <div key={post.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.category} · {post.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {post.status === "published" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                    {post.status === "published" ? "Publicerad" : "Utkast"}
                  </span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg" onClick={() => toggleStatus(post)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg hover:text-red-500" onClick={() => deletePost(post.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}