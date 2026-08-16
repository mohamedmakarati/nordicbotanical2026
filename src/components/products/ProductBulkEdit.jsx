import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Loader2, Edit3, Trash2 } from "lucide-react";

export default function ProductBulkEdit() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [sellersMap, setSellersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Advanced filters
  const [filterSeller, setFilterSeller] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Bulk update fields
  const [bulkAvailability, setBulkAvailability] = useState("");
  const [bulkSeller, setBulkSeller] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkPriceOp, setBulkPriceOp] = useState("");
  const [bulkPriceVal, setBulkPriceVal] = useState("");
  const [bulkCurrency, setBulkCurrency] = useState("");

  useEffect(() => {
    Promise.all([base44.entities.Product.list("-created_date", 500), base44.entities.Seller.list()])
      .then(([prods, sels]) => {
        setProducts(prods);
        setSellers(sels);
        setSellersMap(Object.fromEntries(sels.map(s => [s.id, s.seller_name])));
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.product_title?.toLowerCase().includes(search.toLowerCase()) || sellersMap[p.seller_id]?.toLowerCase().includes(search.toLowerCase());
    const matchSeller = filterSeller === "all" || p.seller_id === filterSeller;
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    const matchMin = !minPrice || (p.price || 0) >= parseFloat(minPrice);
    const matchMax = !maxPrice || (p.price || 0) <= parseFloat(maxPrice);
    return matchSearch && matchSeller && matchCategory && matchMin && matchMax;
  });

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

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  };

  const applyBulk = async () => {
    if (!selected.size) return;
    setSaving(true);
    setSaved(false);
    const updates = {};
    if (bulkAvailability) updates.availability = bulkAvailability;
    if (bulkSeller) updates.seller_id = bulkSeller;
    if (bulkCategory) updates.category = bulkCategory;
    if (bulkCurrency) updates.currency = bulkCurrency;

    for (const id of selected) {
      const product = products.find(p => p.id === id);
      const data = { ...updates };
      if (bulkPriceOp && bulkPriceVal) {
        const val = parseFloat(bulkPriceVal);
        const cur = product?.price || 0;
        if (bulkPriceOp === "set") data.price = val;
        else if (bulkPriceOp === "increase_pct") data.price = parseFloat((cur * (1 + val / 100)).toFixed(2));
        else if (bulkPriceOp === "decrease_pct") data.price = parseFloat((cur * (1 - val / 100)).toFixed(2));
        else if (bulkPriceOp === "increase_fixed") data.price = parseFloat((cur + val).toFixed(2));
        else if (bulkPriceOp === "decrease_fixed") data.price = Math.max(0, parseFloat((cur - val).toFixed(2)));
      }
      if (Object.keys(data).length) await base44.entities.Product.update(id, data);
    }

    setProducts(prev => prev.map(p => {
      if (!selected.has(p.id)) return p;
      const data = {};
      if (bulkAvailability) data.availability = bulkAvailability;
      if (bulkSeller) data.seller_id = bulkSeller;
      if (bulkCategory) data.category = bulkCategory;
      if (bulkCurrency) data.currency = bulkCurrency;
      return { ...p, ...data };
    }));

    setSaving(false);
    setSaved(true);
    setSelected(new Set());
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Bulk actions bar */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Massuppdatering</h3>
          {selected.size > 0 && <Badge className="ml-auto">{selected.size} valda</Badge>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Lagerstatus</Label>
            <Select value={bulkAvailability} onValueChange={setBulkAvailability}>
              <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Ändra ej" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Ändra ej</SelectItem>
                <SelectItem value="in_stock">I lager</SelectItem>
                <SelectItem value="out_of_stock">Slut i lager</SelectItem>
                <SelectItem value="limited">Begränsat</SelectItem>
                <SelectItem value="pre_order">Förbeställning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Butik</Label>
            <Select value={bulkSeller} onValueChange={setBulkSeller}>
              <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Ändra ej" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Ändra ej</SelectItem>
                {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kategori</Label>
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Ändra ej" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Ändra ej</SelectItem>
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
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valuta</Label>
            <Select value={bulkCurrency} onValueChange={setBulkCurrency}>
              <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Ändra ej" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Ändra ej</SelectItem>
                <SelectItem value="SEK">SEK</SelectItem>
                <SelectItem value="NOK">NOK</SelectItem>
                <SelectItem value="DKK">DKK</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prisändring</Label>
            <Select value={bulkPriceOp} onValueChange={setBulkPriceOp}>
              <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Ändra ej" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Ändra ej</SelectItem>
                <SelectItem value="set">Sätt fast pris</SelectItem>
                <SelectItem value="increase_pct">Höj med %</SelectItem>
                <SelectItem value="decrease_pct">Sänk med %</SelectItem>
                <SelectItem value="increase_fixed">Höj med kr</SelectItem>
                <SelectItem value="decrease_fixed">Sänk med kr</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bulkPriceOp && (
            <div className="space-y-1">
              <Label className="text-xs">Värde ({bulkPriceOp.includes("pct") ? "%" : "kr"})</Label>
              <Input type="number" value={bulkPriceVal} onChange={e => setBulkPriceVal(e.target.value)} className="rounded-lg" placeholder="0" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={applyBulk} disabled={saving || selected.size === 0} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Sparar..." : `Uppdatera ${selected.size} produkter`}
          </Button>
          <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting || selected.size === 0} className="gap-2">
            {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {bulkDeleting ? "Tar bort..." : "Ta bort valda"}
          </Button>
          {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle className="w-4 h-4" /> Sparat!</span>}
        </div>
      </div>

      {/* Product list with checkboxes */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök produkt..." className="pl-9 rounded-xl" />
          </div>
          <Select value={filterSeller} onValueChange={setFilterSeller}>
            <SelectTrigger className="w-40 rounded-xl text-sm"><SelectValue placeholder="Butik" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla butiker</SelectItem>
              {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 rounded-xl text-sm"><SelectValue placeholder="Kategori" /></SelectTrigger>
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
          <div className="flex items-center gap-1.5">
            <Input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min kr" className="w-24 rounded-xl" />
            <span className="text-xs text-muted-foreground">–</span>
            <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max kr" className="w-24 rounded-xl" />
          </div>
          <span className="text-sm text-muted-foreground ml-auto">{filtered.length} produkter</span>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" /></th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produkt</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Butik</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pris</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map(p => (
                    <tr key={p.id} className={`hover:bg-muted/20 transition-colors cursor-pointer ${selected.has(p.id) ? "bg-accent/20" : ""}`} onClick={() => toggleSelect(p.id)}>
                      <td className="px-3 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => {}} className="rounded pointer-events-none" /></td>
                      <td className="px-4 py-3 font-medium line-clamp-1 max-w-[220px]">{p.product_title}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{sellersMap[p.seller_id] || "—"}</td>
                      <td className="px-4 py-3 text-right">{p.price?.toFixed(0)} kr</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.availability === "in_stock" ? "default" : "secondary"} className="text-xs rounded-md">
                          {p.availability === "in_stock" ? "I lager" : "Slut"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}