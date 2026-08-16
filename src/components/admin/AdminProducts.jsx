import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, ExternalLink, Search, RefreshCw, Tag, Check, X, Pencil, Download, Image } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountValue, setDiscountValue] = useState("");
  const [editProduct, setEditProduct] = useState(null); // product being edited in modal
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const [prods, sels] = await Promise.all([
      base44.entities.Product.list("-created_date", 200),
      base44.entities.Seller.list(),
    ]);
    const sellersMap = Object.fromEntries(sels.map((s) => [s.id, s.seller_name]));
    setProducts(prods);
    setSellers(sellersMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Ta bort denna produkt?")) return;
    setDeleting(id);
    await base44.entities.Product.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Ta bort ${selected.size} produkter?`)) return;
    for (const id of selected) {
      await base44.entities.Product.delete(id);
    }
    setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  };

  const startDiscount = (p) => {
    setEditingDiscount(p.id);
    setDiscountValue(p.regular_price ? Math.round(((p.regular_price - p.price) / p.regular_price) * 100) : "");
  };

  const applyDiscount = async (p) => {
    const pct = parseFloat(discountValue);
    if (isNaN(pct) || pct < 0 || pct >= 100) return;
    const regular = p.regular_price || p.price;
    const newPrice = parseFloat((regular * (1 - pct / 100)).toFixed(2));
    await base44.entities.Product.update(p.id, {
      regular_price: regular,
      price: newPrice,
      total_price: newPrice + (p.shipping_cost || 0),
    });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, regular_price: regular, price: newPrice } : x));
    setEditingDiscount(null);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setEditForm({
      product_title: p.product_title || "",
      price: p.price || 0,
      regular_price: p.regular_price || "",
      image_url: p.image_url || "",
      product_url: p.product_url || "",
      availability: p.availability || "in_stock",
      pot_size: p.pot_size || "",
      currency: p.currency || "SEK",
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
    setProducts((prev) => prev.map((x) => x.id === editProduct.id ? { ...x, ...data } : x));
    setSaving(false);
    setEditProduct(null);
  };

  const exportCSV = () => {
    const rows = [
      ["Titel", "Pris", "Ord.pris", "Valuta", "Tillgänglighet", "Butik", "URL", "Bild-URL", "Krukstorlek"],
      ...filtered.map((p) => [
        p.product_title, p.price, p.regular_price || "", p.currency, p.availability,
        sellers[p.seller_id] || "", p.product_url || "", p.image_url || "", p.pot_size || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "produkter.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const filtered = products.filter((p) =>
    p.product_title?.toLowerCase().includes(search.toLowerCase()) ||
    sellers[p.seller_id]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Sök produkt..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Button variant="outline" size="sm" onClick={load} className="rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Uppdatera
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl gap-2">
          <Download className="w-4 h-4" /> Exportera CSV
        </Button>
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="rounded-xl gap-2">
            <Trash2 className="w-4 h-4" /> Ta bort {selected.size} st
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} produkter</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-3">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produkt</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Butik</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pris</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Rabatt</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((p) => (
                  <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${selected.has(p.id) ? "bg-accent/20" : ""}`}>
                    <td className="px-3 py-3 text-center">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border/40 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Image className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground line-clamp-1 max-w-[200px]">{p.product_title}</div>
                          {p.pot_size && <div className="text-xs text-muted-foreground">{p.pot_size}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{sellers[p.seller_id] || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium text-foreground">{p.price?.toFixed(0)} kr</div>
                      {p.regular_price && p.regular_price > p.price && (
                        <div className="text-xs text-muted-foreground line-through">{p.regular_price?.toFixed(0)} kr</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.availability === "in_stock" ? "default" : "destructive"} className="rounded-md text-xs">
                        {p.availability === "in_stock" ? "I lager" : p.availability === "limited" ? "Begränsat" : "Slut"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingDiscount === p.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Input type="number" min="0" max="99" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="%" className="h-7 w-16 text-xs text-center px-2 rounded-lg" autoFocus />
                          <button onClick={() => applyDiscount(p)} className="p-1 text-primary"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingDiscount(null)} className="p-1 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => startDiscount(p)} className="flex items-center gap-1 mx-auto text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Tag className="w-3.5 h-3.5" />
                          {p.regular_price && p.regular_price > p.price
                            ? <span className="text-destructive font-medium">-{Math.round(((p.regular_price - p.price) / p.regular_price) * 100)}%</span>
                            : <span>Set</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)} title="Redigera">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {p.product_url && (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><ExternalLink className="w-3.5 h-3.5" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Redigera produkt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image preview */}
            {editForm.image_url && (
              <img src={editForm.image_url} alt="" className="w-full h-40 object-contain rounded-xl border border-border bg-muted" />
            )}
            <div className="space-y-1">
              <Label>Bild-URL</Label>
              <Input value={editForm.image_url} onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>Produkttitel</Label>
              <Input value={editForm.product_title} onChange={(e) => setEditForm((f) => ({ ...f, product_title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pris (kr)</Label>
                <Input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Ordinarie pris (kr)</Label>
                <Input type="number" value={editForm.regular_price} onChange={(e) => setEditForm((f) => ({ ...f, regular_price: e.target.value }))} placeholder="Lämna tomt om ej rabatterad" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tillgänglighet</Label>
                <Select value={editForm.availability} onValueChange={(v) => setEditForm((f) => ({ ...f, availability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">I lager</SelectItem>
                    <SelectItem value="limited">Begränsat</SelectItem>
                    <SelectItem value="out_of_stock">Slut</SelectItem>
                    <SelectItem value="pre_order">Förbeställning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Krukstorlek</Label>
                <Input value={editForm.pot_size} onChange={(e) => setEditForm((f) => ({ ...f, pot_size: e.target.value }))} placeholder="t.ex. 12cm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Produkt-URL</Label>
              <Input value={editForm.product_url} onChange={(e) => setEditForm((f) => ({ ...f, product_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditProduct(null)}>Avbryt</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Sparar..." : "Spara"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}