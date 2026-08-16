import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileText, FileJson, Table } from "lucide-react";

export default function ProductExport() {
  const [sellers, setSellers] = useState([]);
  const [format, setFormat] = useState("csv");
  const [filterSeller, setFilterSeller] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [count, setCount] = useState(null);
  const [products, setProducts] = useState([]);
  const [sellersMap, setSellersMap] = useState({});

  useEffect(() => {
    Promise.all([base44.entities.Product.list("-created_date", 1000), base44.entities.Seller.list()])
      .then(([prods, sels]) => {
        setProducts(prods);
        setSellers(sels);
        setSellersMap(Object.fromEntries(sels.map(s => [s.id, s.seller_name])));
        setCount(prods.length);
      });
  }, []);

  const getFiltered = () => products.filter(p => {
    if (filterSeller !== "all" && p.seller_id !== filterSeller) return false;
    if (filterStock !== "all" && p.availability !== filterStock) return false;
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    return true;
  });

  const exportCSV = (rows) => {
    const cols = ["product_title", "price", "regular_price", "currency", "availability", "seller", "product_url", "image_url", "pot_size"];
    const header = cols.join(",");
    const lines = rows.map(p =>
      cols.map(c => {
        const v = c === "seller" ? (sellersMap[p.seller_id] || "") : (p[c] ?? "");
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(",")
    );
    return header + "\n" + lines.join("\n");
  };

  const exportJSON = (rows) => JSON.stringify(rows.map(p => ({
    ...p, seller_name: sellersMap[p.seller_id] || ""
  })), null, 2);

  const exportXML = (rows) => {
    const items = rows.map(p => `  <product>
    <title>${p.product_title || ""}</title>
    <price>${p.price || 0}</price>
    <currency>${p.currency || "SEK"}</currency>
    <availability>${p.availability || ""}</availability>
    <seller>${sellersMap[p.seller_id] || ""}</seller>
    <url>${p.product_url || ""}</url>
    <image>${p.image_url || ""}</image>
  </product>`).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<products>\n${items}\n</products>`;
  };

  const doExport = () => {
    setExporting(true);
    const rows = getFiltered();
    let content, mime, ext;
    if (format === "csv") { content = exportCSV(rows); mime = "text/csv"; ext = "csv"; }
    else if (format === "json") { content = exportJSON(rows); mime = "application/json"; ext = "json"; }
    else if (format === "xml") { content = exportXML(rows); mime = "application/xml"; ext = "xml"; }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `produkter_${new Date().toISOString().slice(0,10)}.${ext}`; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const filtered = getFiltered();

  const formatOptions = [
    { value: "csv", label: "CSV", icon: Table },
    { value: "json", label: "JSON", icon: FileJson },
    { value: "xml", label: "XML", icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="font-medium text-foreground">Exportformat</h3>
        <div className="grid grid-cols-3 gap-3">
          {formatOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFormat(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${format === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              <Icon className={`w-6 h-6 ${format === value ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium text-sm ${format === value ? "text-primary" : "text-foreground"}`}>{label}</span>
            </button>
          ))}
        </div>

        <h3 className="font-medium text-foreground">Filter</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Butik</Label>
            <Select value={filterSeller} onValueChange={setFilterSeller}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla butiker</SelectItem>
                {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Lagerstatus</Label>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                <SelectItem value="in_stock">I lager</SelectItem>
                <SelectItem value="out_of_stock">Slut</SelectItem>
                <SelectItem value="limited">Begränsat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Min pris (kr)</Label>
            <Input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label>Max pris (kr)</Label>
            <Input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="9999" className="rounded-xl" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">{filtered.length} produkter matchar filter</p>
          <Button onClick={doExport} disabled={exporting || filtered.length === 0} className="gap-2">
            <Download className="w-4 h-4" />
            {exporting ? "Exporterar..." : `Exportera ${filtered.length} produkter`}
          </Button>
        </div>
      </div>
    </div>
  );
}