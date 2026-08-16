import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, RefreshCw, Pencil, Trash2, ExternalLink, Image, Tag, Check, X, Filter, Trash } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [sellersMap, setSellersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeller, setFilterSeller] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [prods, sels] = await Promise.all([
      base44.entities.Product.list("-created_date", 500),
      base44.entities.Seller.list(),
    ]);
    setSellers(sels);
    setSellersMap(Object.fromEntries(sels.map(s => [s.id, s.seller_name])));
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (p) => {
    setEditProduct(p);
    setEditForm({
      product_title: p.product_title || "",
      price: p.price || 0,
      regular_price: p.regular_price || "",
      currency: p.currency || "SEK",
      image_url: p.image_url || "",
      product_url: p.product_url || "",
      availability: p.availability || "in_stock",
      pot_size: p.pot_size || "",
      seller_id: p.seller_id || "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    const data = {
      ...editForm,
      price: parseFloat(editForm.price) || 0,
      regular_price: editForm.regular_price ? parseFloat(editForm.regular_price) : undefined,
    };
    await base44.entities.Product.update(editProduct.id, data);
    setProducts(prev => prev.map(x => x.id === editProduct.id ? { ...x, ...data } : x));
    setSaving(false);
    setEditProduct(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Ta bort denna produkt?")) return;
    setDeleting(id);
    await base44.entities.Product.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Ta bort ${selected.size} valda produkter? Detta kan inte ångras.`)) return;
    setBulkDeleting(true);
    for (const id of selected) {
      await base44.entities.Product.delete(id).catch(() => {});
    }
    setProducts(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set());
    setBulkDeleting(false);
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.product_title?.toLowerCase().includes(search.toLowerCase()) ||
      sellersMap[p.seller_id]?.toLowerCase().includes(search.toLowerCase());
    const matchSeller = filterSeller === "all" || p.seller_id === filterSeller;
    const matchStock = filterStock === "all" || p.availability === filterStock;
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    const matchMinPrice = !minPrice || (p.price || 0) >= parseFloat(minPrice);
    const matchMaxPrice = !maxPrice || (p.price || 0) <= parseFloat(maxPrice);
    return matchSearch && matchSeller && matchStock && matchCategory && matchMinPrice && matchMaxPrice;
  });

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök produkt eller butik..." className="pl-9 rounded-xl" />
        </div>
        <Select value={filterSeller} onValueChange={setFilterSeller}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Butik" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla butiker</SelectItem>
            {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kategorier</SelectItem>
            <SelectItem value="tropical">Tropiska</SelectItem>
            <SelectItem value="succulent">Suckulenter</SelectItem>
            <SelectItem value="cactus">Kaktusar</SelectItem>
            <SelectItem value="fern">Ormbunkar</SelectItem>
            <SelectItem value="orchid">Orkidéer</SelectItem>
            <SelectItem value="palm">Palmer</SelectItem>
            <SelectItem value="herb">Örter</SelectItem>
            <SelectItem value="tree">Träd</SelectItem>
            <SelectItem value="climbing">Klättrande</SelectItem>
            <SelectItem value="rose">Rosor</SelectItem>
            <SelectItem value="other">Annat</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStock} onValueChange={setFilterStock}>
          <SelectTrigger className="w-36 rounded-xl"><SelectValue placeholder="Lager" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla</SelectItem>
            <SelectItem value="in_stock">I lager</SelectItem>
            <SelectItem value="out_of_stock">Slut</SelectItem>
            <SelectItem value="limited">Begränsat</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min kr" className="w-24 rounded-xl" />
          <span className="text-xs text-muted-foreground">–</span>
          <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max kr" className="w-24 rounded-xl" />
        </div>
        <Button variant="outline" size="sm" onClick={load} className="rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Ladda om
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} produkter</span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5">
          <Badge>{selected.size} valda</Badge>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkDeleting} className="gap-2 rounded-lg ml-auto">
            {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {bulkDeleting ? "Tar bort..." : "Ta bort valda"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="rounded-lg">Avmarkera</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" /></th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produkt</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Butik</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pris</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${selected.has(p.id) ? "bg-accent/20" : ""}`}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border/40 shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Image className="w-4 h-4 text-muted-foreground" /></div>}
                        <div>
                          <div className="font-medium line-clamp-1 max-w-[200px]">{p.product_title}</div>
                          {p.pot_size && <div className="text-xs text-muted-foreground">{p.pot_size}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{sellersMap[p.seller_id] || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium">{p.price?.toFixed(0)} kr</div>
                      {p.regular_price && p.regular_price > p.price && <div className="text-xs text-muted-foreground line-through">{p.regular_price?.toFixed(0)} kr</div>}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <Badge variant={p.availability === "in_stock" ? "default" : "destructive"} className="text-xs rounded-md">
                        {p.availability === "in_stock" ? "I lager" : p.availability === "limited" ? "Begränsat" : "Slut"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        {p.product_url && <a href={p.product_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><ExternalLink className="w-3.5 h-3.5" /></Button></a>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!editProduct} onOpenChange={o => !o && setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Redigera produkt</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {editForm.image_url && <img src={editForm.image_url} alt="" className="w-full h-40 object-contain rounded-xl border border-border bg-muted" />}
            <div className="space-y-1"><Label>Bild-URL</Label><Input value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="space-y-1"><Label>Produkttitel</Label><Input value={editForm.product_title} onChange={e => setEditForm(f => ({ ...f, product_title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Pris</Label><Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Ord. pris</Label><Input type="number" value={editForm.regular_price} onChange={e => setEditForm(f => ({ ...f, regular_price: e.target.value }))} placeholder="Om rabatterad" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tillgänglighet</Label>
                <Select value={editForm.availability} onValueChange={v => setEditForm(f => ({ ...f, availability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">I lager</SelectItem>
                    <SelectItem value="limited">Begränsat</SelectItem>
                    <SelectItem value="out_of_stock">Slut</SelectItem>
                    <SelectItem value="pre_order">Förbeställning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Krukstorlek</Label><Input value={editForm.pot_size} onChange={e => setEditForm(f => ({ ...f, pot_size: e.target.value }))} placeholder="t.ex. 12cm" /></div>
            </div>
            <div className="space-y-1">
              <Label>Butik</Label>
              <Select value={editForm.seller_id} onValueChange={v => setEditForm(f => ({ ...f, seller_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Välj butik" /></SelectTrigger>
                <SelectContent>
                  {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Produkt-URL</Label><Input value={editForm.product_url} onChange={e => setEditForm(f => ({ ...f, product_url: e.target.value }))} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Avbryt</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Sparar..." : "Spara"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}