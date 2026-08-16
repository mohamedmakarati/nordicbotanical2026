import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scan, Loader2, Globe, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, ShieldCheck, ShieldOff,
  Sparkles, Sun, Droplets, MapPin, Truck, Package
} from "lucide-react";

const CATEGORIES = ["tropical","succulent","cactus","fern","orchid","palm","herb","tree","climbing","rose","other"];
const CATEGORY_LABELS = {
  tropical: "Tropisk", succulent: "Suckulent", cactus: "Kaktus", fern: "Ormbunke",
  orchid: "Orkidé", palm: "Palm", herb: "Ört", tree: "Träd", climbing: "Klängväxt",
  rose: "Ros", other: "Annat"
};
const AVAIL_LABELS = {
  in_stock: { label: "I lager", cls: "bg-primary/10 text-primary" },
  out_of_stock: { label: "Slut", cls: "bg-destructive/10 text-destructive" },
  limited: { label: "Begränsat", cls: "bg-amber-100 text-amber-700" },
  pre_order: { label: "Förboka", cls: "bg-blue-100 text-blue-700" },
};

export default function ProductScraper() {
  const [url, setUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [robotsInfo, setRobotsInfo] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    base44.entities.Seller.list().then(setSellers).catch(() => {});
  }, []);

  const scan = async () => {
    if (!url.trim() || !storeName.trim()) return;
    setError("");
    setResults([]);
    setRobotsInfo(null);
    setScanning(true);

    try {
      const res = await base44.functions.invoke("scrapeStoreProducts", {
        url: url.trim(),
        store_name: storeName.trim(),
        seller_id: selectedSellerId || undefined,
      });
      const data = res.data;
      if (data?.error) throw new Error(data.error);

      setRobotsInfo({ allowed: data.robots_allowed, details: data.robots_details });
      const products = data.products || [];
      setResults(products.map(p => ({ ...p, _status: p.is_duplicate ? "flagged" : "pending" })));
    } catch (err) {
      setError(err.message || "Något gick fel vid skanning.");
    } finally {
      setScanning(false);
    }
  };

  const handleApprove = async (result) => {
    setProcessing(result.id);
    try {
      // Create Product record
      await base44.entities.Product.create({
        product_title: result.product_name,
        seller_id: result.seller_id,
        price: result.price,
        regular_price: result.regular_price || undefined,
        currency: result.currency || "SEK",
        product_url: result.product_url,
        image_url: result.image_url || undefined,
        availability: result.availability || "in_stock",
        last_checked: new Date().toISOString(),
      });
      // Mark ScraperResult as approved
      await base44.entities.ScraperResult.update(result.id, { status: "approved", imported_product_id: result.id });
      setResults(prev => prev.map(r => r.id === result.id ? { ...r, _status: "approved" } : r));
    } catch (e) {
      setError("Kunde inte godkänna: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (result) => {
    setProcessing(result.id);
    try {
      await base44.entities.ScraperResult.update(result.id, { status: "rejected" });
      setResults(prev => prev.map(r => r.id === result.id ? { ...r, _status: "rejected" } : r));
    } finally {
      setProcessing(null);
    }
  };

  const approveAll = async () => {
    const pending = results.filter(r => r._status === "pending");
    for (const r of pending) await handleApprove(r);
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setEditData({ ...r });
  };
  const saveEdit = async () => {
    await base44.entities.ScraperResult.update(editId, {
      product_name: editData.product_name,
      scientific_name: editData.scientific_name,
      description: editData.description,
      price: parseFloat(editData.price),
      category: editData.category,
      light_requirement: editData.light_requirement,
      water_requirement: editData.water_requirement,
      hardiness_zone: editData.hardiness_zone,
      pot_size: editData.pot_size,
      plant_size: editData.plant_size,
    });
    setResults(prev => prev.map(r => r.id === editId ? { ...r, ...editData } : r));
    setEditId(null);
  };

  const pendingCount = results.filter(r => r._status === "pending").length;
  const approvedCount = results.filter(r => r._status === "approved").length;
  const rejectedCount = results.filter(r => r._status === "rejected").length;
  const dupCount = results.filter(r => r.is_duplicate).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Scan className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">Skrapa & Importera Produkter</h2>
          <p className="text-sm text-muted-foreground">Klistra in en butiks-URL — AI extraherar produkter som utkast för godkännande</p>
        </div>
      </div>

      {/* URL + Store Input */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Butiksnamn *</label>
            <Input
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder="t.ex. Blomsterlandet"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Välj befintlig butik (valfritt)</label>
            <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
              <SelectTrigger className="rounded-xl text-sm h-9">
                <SelectValue placeholder="— ingen / ny butik —" />
              </SelectTrigger>
              <SelectContent>
                {sellers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && scan()}
              placeholder="https://www.blomsterlandet.se/produkter/krukvaxter/"
              className="pl-9 rounded-xl"
            />
          </div>
          <Button onClick={scan} disabled={scanning || !url.trim() || !storeName.trim()} className="rounded-xl gap-2 px-6">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
            {scanning ? "Skannar..." : "Skanna"}
          </Button>
        </div>
        {scanning && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-1">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Kontrollerar robots.txt, hämtar sidan och extraherar produkter med AI…</span>
          </div>
        )}
      </div>

      {/* Robots.txt status */}
      {robotsInfo && (
        <div className={`flex items-center gap-3 rounded-xl p-4 text-sm border ${
          robotsInfo.allowed
            ? "bg-primary/5 border-primary/20 text-primary"
            : "bg-destructive/5 border-destructive/20 text-destructive"
        }`}>
          {robotsInfo.allowed ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <ShieldOff className="w-5 h-5 shrink-0" />}
          <div>
            <span className="font-medium">{robotsInfo.allowed ? "robots.txt tillåter skrapning" : "robots.txt blockerar skrapning"}</span>
            {robotsInfo.details && <span className="opacity-70"> — {robotsInfo.details}</span>}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Skanningen misslyckades</p>
            <p className="text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <span className="font-medium text-sm">{results.length} produkter hittade</span>
            <div className="flex gap-2 flex-wrap">
              {dupCount > 0 && <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">{dupCount} dubbletter</Badge>}
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">{approvedCount} godkända</Badge>
              {rejectedCount > 0 && <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5">{rejectedCount} avvisade</Badge>}
              {pendingCount > 0 && <Badge variant="outline">{pendingCount} väntar</Badge>}
            </div>
            {pendingCount > 0 && (
              <Button size="sm" onClick={approveAll} disabled={processing} className="ml-auto rounded-xl text-xs h-8 gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Godkänn alla ({pendingCount})
              </Button>
            )}
          </div>

          {/* Product cards */}
          <div className="space-y-2">
            {results.map((r) => {
              const isExpanded = expanded === r.id;
              const isApproved = r._status === "approved";
              const isRejected = r._status === "rejected";
              const isEditing = editId === r.id;
              const borderColor = isApproved ? "border-green-300" : isRejected ? "border-destructive/30" : r.is_duplicate ? "border-orange-300" : "border-border";
              const bgOpacity = isRejected ? "opacity-50" : "";

              return (
                <div key={r.id} className={`bg-card border ${borderColor} rounded-xl overflow-hidden transition-all ${bgOpacity}`}>
                  {r.is_duplicate && (
                    <div className="bg-orange-50 border-b border-orange-200 px-4 py-1.5 flex items-center gap-2 text-xs text-orange-700">
                      <AlertTriangle className="w-3.5 h-3.5" /> Möjlig dubblett — produkten verkar redan finnas i katalogen
                    </div>
                  )}
                  <div className="p-4 flex gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-muted shrink-0 overflow-hidden">
                      {r.image_url
                        ? <img src={r.image_url} alt={r.product_name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">Bild</div>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input value={editData.product_name || ""} onChange={e => setEditData({ ...editData, product_name: e.target.value })} placeholder="Produktnamn" className="h-8 text-sm" />
                          <Input value={editData.scientific_name || ""} onChange={e => setEditData({ ...editData, scientific_name: e.target.value })} placeholder="Vetenskapligt namn" className="h-8 text-sm" />
                          <Textarea value={editData.description || ""} onChange={e => setEditData({ ...editData, description: e.target.value })} placeholder="Beskrivning" className="text-sm min-h-[60px]" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="number" value={editData.price || ""} onChange={e => setEditData({ ...editData, price: e.target.value })} placeholder="Pris" className="h-8 text-sm" />
                            <Select value={editData.category || "other"} onValueChange={v => setEditData({ ...editData, category: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Kategori" /></SelectTrigger>
                              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input value={editData.light_requirement || ""} onChange={e => setEditData({ ...editData, light_requirement: e.target.value })} placeholder="Ljusbehov" className="h-8 text-sm" />
                            <Input value={editData.water_requirement || ""} onChange={e => setEditData({ ...editData, water_requirement: e.target.value })} placeholder="Vattenbehov" className="h-8 text-sm" />
                            <Input value={editData.hardiness_zone || ""} onChange={e => setEditData({ ...editData, hardiness_zone: e.target.value })} placeholder="Härdighetszon" className="h-8 text-sm" />
                            <Input value={editData.pot_size || ""} onChange={e => setEditData({ ...editData, pot_size: e.target.value })} placeholder="Krukstorlek" className="h-8 text-sm" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} className="h-7 text-xs rounded-lg">Spara</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-7 text-xs rounded-lg">Avbryt</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-start gap-2 mb-1">
                            <h4 className="font-medium text-sm text-foreground leading-snug">{r.product_name}</h4>
                            {r.scientific_name && <span className="text-xs text-muted-foreground italic">{r.scientific_name}</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge className="text-[10px] rounded-md border-0 bg-muted text-muted-foreground">{CATEGORY_LABELS[r.category] || r.category}</Badge>
                            {r.availability && <Badge className={`text-[10px] rounded-md border-0 ${AVAIL_LABELS[r.availability]?.cls || ""}`}>{AVAIL_LABELS[r.availability]?.label || r.availability}</Badge>}
                            {r.ai_confidence != null && (
                              <Badge className={`text-[10px] rounded-md border-0 ${r.ai_confidence >= 80 ? "bg-primary/10 text-primary" : r.ai_confidence >= 60 ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
                                AI {r.ai_confidence}%
                              </Badge>
                            )}
                            {r.pot_size && <Badge variant="outline" className="text-[10px] rounded-md">{r.pot_size}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs mb-1">
                            <span className="font-semibold text-foreground">{Number(r.price || 0).toFixed(0)} {r.currency || "SEK"}</span>
                            {r.regular_price && <span className="text-muted-foreground line-through">{Number(r.regular_price).toFixed(0)} {r.currency}</span>}
                            {r.discount_pct && <span className="text-destructive">-{r.discount_pct}%</span>}
                          </div>
                          {/* Care attributes */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {r.light_requirement && <span className="flex items-center gap-1"><Sun className="w-3 h-3" />{r.light_requirement}</span>}
                            {r.water_requirement && <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{r.water_requirement}</span>}
                            {r.hardiness_zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.hardiness_zone}</span>}
                            {r.plant_size && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{r.plant_size}</span>}
                            {r.shipping_info && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{r.shipping_info}</span>}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {isApproved
                          ? <Badge className="bg-green-500 text-white text-xs justify-center">Godkänd</Badge>
                          : isRejected
                          ? <Badge variant="destructive" className="text-xs justify-center">Avvisad</Badge>
                          : (
                            <>
                              <Button size="sm" onClick={() => handleApprove(r)} disabled={processing === r.id}
                                className="h-7 px-3 text-xs rounded-lg gap-1 bg-green-500 hover:bg-green-600">
                                {processing === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Godkänn
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => startEdit(r)}
                                className="h-7 px-3 text-xs rounded-lg gap-1">
                                Redigera
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleReject(r)} disabled={processing === r.id}
                                className="h-7 px-3 text-xs rounded-lg gap-1 text-destructive hover:bg-destructive/10">
                                <XCircle className="w-3 h-3" /> Avvisa
                              </Button>
                            </>
                          )}
                        {r.product_url && (
                          <a href={r.product_url} target="_blank" rel="noopener noreferrer"
                            className="h-7 px-3 text-xs rounded-lg gap-1 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
                            <ExternalLink className="w-3 h-3" /> Länk
                          </a>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg mx-auto"
                          onClick={() => setExpanded(isExpanded ? null : r.id)}>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && !isEditing && (
                    <div className="border-t border-border/40 px-4 py-4 space-y-3">
                      {r.description && (
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Beskrivning (omskriven av AI)</p>
                            <p className="text-sm text-foreground">{r.description}</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {[
                          ["Vetenskapligt namn", r.scientific_name],
                          ["Kategori", CATEGORY_LABELS[r.category] || r.category],
                          ["Ljusbehov", r.light_requirement],
                          ["Vattenbehov", r.water_requirement],
                          ["Härdighetszon", r.hardiness_zone],
                          ["Krukstorlek", r.pot_size],
                          ["Växtstorlek", r.plant_size],
                          ["Leveransinfo", r.shipping_info],
                          ["Säljare", r.seller_name],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <div key={label}>
                            <span className="text-muted-foreground">{label}: </span>
                            <span className="text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}