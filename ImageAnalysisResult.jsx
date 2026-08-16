import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, X, Loader2, Sparkles } from "lucide-react";

const CATEGORIES = ["tropical", "succulent", "cactus", "fern", "orchid", "palm", "herb", "tree", "climbing", "other"];
const POT_SIZES = ["6cm", "9cm", "12cm", "14cm", "17cm", "19cm", "21cm", "24cm", "27cm", "30cm+"];

export default function ImageAnalysisResult({ analysis, exampleId, imageUrl, sellers, onDone }) {
  const [form, setForm] = useState({
    product_title: analysis.suggested_title || analysis.plant_name || "",
    plant_name: analysis.plant_name || "",
    scientific_name: analysis.scientific_name || "",
    category: analysis.category || "other",
    pot_size: analysis.pot_size || "",
    condition: analysis.condition || "good",
    description: analysis.suggested_description || "",
    price: analysis.price_min || "",
    seller_id: "",
    image_url: imageUrl || ""
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const confidence = analysis.confidence || 0;
  const confColor = confidence >= 70 ? "text-primary" : confidence >= 40 ? "text-amber-600" : "text-red-500";

  const handleImport = async () => {
    setSaving(true);
    await base44.functions.invoke("aiProductTrainer", {
      action: "import_product",
      example_id: exampleId,
      product_data: {
        ...form,
        price: parseFloat(form.price) || 0,
        availability: "in_stock"
      }
    });
    setSaving(false);
    setDone(true);
    onDone?.();
  };

  const handleReject = async () => {
    await base44.functions.invoke("aiProductTrainer", {
      action: "update_example",
      example_id: exampleId,
      updates: { status: "rejected" }
    });
    onDone?.();
  };

  if (done) return (
    <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-xl px-4 py-4">
      <CheckCircle className="w-5 h-5 shrink-0" /> Produkten importerades!
    </div>
  );

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI-analys</span>
        </div>
        <span className={`text-xs font-semibold ${confColor}`}>
          {confidence}% säkerhet
        </span>
      </div>

      {imageUrl && (
        <img src={imageUrl} alt="plant" className="w-full max-h-48 object-contain rounded-xl bg-muted/20" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Produkttitel</Label>
          <Input value={form.product_title} onChange={(e) => setForm(f => ({...f, product_title: e.target.value}))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Växtnamn</Label>
          <Input value={form.plant_name} onChange={(e) => setForm(f => ({...f, plant_name: e.target.value}))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Vetenskapligt namn</Label>
          <Input value={form.scientific_name} onChange={(e) => setForm(f => ({...f, scientific_name: e.target.value}))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Pris (SEK)</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm(f => ({...f, price: e.target.value}))} className="mt-1 h-8 text-sm"
            placeholder={`${analysis.price_min || 0}–${analysis.price_max || 0}`} />
        </div>
        <div>
          <Label className="text-xs">Kategori</Label>
          <Select value={form.category} onValueChange={(v) => setForm(f => ({...f, category: v}))}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Krukstorlek</Label>
          <Select value={form.pot_size} onValueChange={(v) => setForm(f => ({...f, pot_size: v}))}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Välj..." /></SelectTrigger>
            <SelectContent>
              {POT_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Butik</Label>
          <Select value={form.seller_id} onValueChange={(v) => setForm(f => ({...f, seller_id: v}))}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Välj butik..." /></SelectTrigger>
            <SelectContent>
              {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Beskrivning</Label>
          <Textarea value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
            className="mt-1 text-sm resize-none" rows={3} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleImport} disabled={saving} className="flex-1 rounded-xl gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Godkänn & importera
        </Button>
        <Button variant="outline" onClick={handleReject} className="rounded-xl gap-2">
          <X className="w-4 h-4" /> Avvisa
        </Button>
      </div>
    </div>
  );
}