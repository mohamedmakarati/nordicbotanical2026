import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Loader2, ImageIcon, CheckCircle, RefreshCw,
  ChevronDown, ChevronUp, Tag, Info, Leaf
} from "lucide-react";

const CATEGORIES = ["tropical", "succulent", "cactus", "fern", "orchid", "palm", "herb", "tree", "climbing", "rose", "other"];
const CONDITIONS = ["excellent", "good", "fair", "needs_care"];
const CONDITION_LABELS = { excellent: "Utmärkt", good: "Bra", fair: "Godkänd", needs_care: "Behöver vård" };

export default function PlantImageIdentifier({ onApply }) {
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | analyzing | review | applied
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [edited, setEdited] = useState(null);
  const [showKeywords, setShowKeywords] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
    setAnalysis(null);
    setEdited(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const runAnalysis = async () => {
    if (!file) return;
    setError("");
    setStatus("uploading");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStatus("analyzing");
      const res = await base44.functions.invoke("aiProductTrainer", {
        action: "analyze_image_seller",
        image_url: file_url
      });
      if (res.data?.error) throw new Error(res.data.error);
      const a = res.data.analysis;
      setAnalysis({ ...a, image_url: file_url });
      setEdited({ ...a, image_url: file_url });
      setStatus("review");
    } catch (err) {
      setError(err.message || "Analys misslyckades.");
      setStatus("idle");
    }
  };

  const handleApply = () => {
    onApply?.({
      plant_name: edited.plant_name || "",
      scientific_name: edited.scientific_name || "",
      category: edited.category || "other",
      condition: edited.condition || "good",
      pot_size: edited.pot_size || "",
      description: edited.description || "",
      care_info: edited.care_info || "",
      product_title: edited.product_title || "",
      starting_price: edited.auction_starting_price_sek || "",
      buy_now_price: edited.suggested_price_sek || "",
      seo_keywords: edited.seo_keywords || [],
      image_url: edited.image_url || ""
    });
    setStatus("applied");
  };

  const set = (k, v) => setEdited(prev => ({ ...prev, [k]: v }));

  const confidence = analysis?.confidence || 0;
  const confColor = confidence >= 70 ? "text-primary" : confidence >= 40 ? "text-amber-600" : "text-red-500";

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">AI Växtidentifiering</p>
          <p className="text-xs text-muted-foreground">Ladda upp ett foto — AI fyller i alla fält åt dig</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload zone */}
        {status !== "applied" && (
          <div
            className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : preview ? "border-border/30" : "border-border/40 hover:border-primary/50 hover:bg-muted/20"
            }`}
            onClick={() => !preview && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />

            {preview ? (
              <div className="relative">
                <img src={preview} alt="växt" className="w-full max-h-52 object-contain bg-muted/10" />
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setStatus("idle"); setAnalysis(null); }}
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/40 shadow-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Klicka eller dra dit ett växtfoto</p>
                <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP</p>
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {file && status === "idle" && (
          <Button onClick={runAnalysis} className="w-full rounded-xl gap-2">
            <Sparkles className="w-4 h-4" /> Identifiera växt med AI
          </Button>
        )}

        {(status === "uploading" || status === "analyzing") && (
          <div className="flex items-center justify-center gap-3 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            {status === "uploading" ? "Laddar upp bild…" : "AI analyserar växten…"}
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* Applied confirmation */}
        {status === "applied" && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-xl px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            AI-data tillämpades! Du kan redigera fälten nedan.
            <button onClick={() => { setFile(null); setPreview(null); setStatus("idle"); setAnalysis(null); }}
              className="ml-auto text-xs underline text-primary/70 hover:text-primary">
              Ny bild
            </button>
          </div>
        )}

        {/* Review / edit panel */}
        {status === "review" && edited && (
          <div className="space-y-4">
            {/* Confidence badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5" />
                Granska och korrigera vid behov
              </div>
              <span className={`text-xs font-semibold ${confColor}`}>
                {confidence}% säkerhet
              </span>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Produkttitel</Label>
                <Input value={edited.product_title || ""} onChange={(e) => set("product_title", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Växtnamn</Label>
                <Input value={edited.plant_name || ""} onChange={(e) => set("plant_name", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Vetenskapligt namn</Label>
                <Input value={edited.scientific_name || ""} onChange={(e) => set("scientific_name", e.target.value)} className="h-8 text-sm" placeholder="Genus species" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Kategori</Label>
                <Select value={edited.category || "other"} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Skick</Label>
                <Select value={edited.condition || "good"} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => <SelectItem key={c} value={c}>{CONDITION_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Krukstorlek</Label>
                <Input value={edited.pot_size || ""} onChange={(e) => set("pot_size", e.target.value)} className="h-8 text-sm" placeholder="t.ex. 12cm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Förslag pris (SEK)</Label>
                <Input type="number" value={edited.suggested_price_sek || ""} onChange={(e) => set("suggested_price_sek", e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Startbud (SEK)</Label>
                <Input type="number" value={edited.auction_starting_price_sek || ""} onChange={(e) => set("auction_starting_price_sek", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs mb-1 block">Beskrivning</Label>
                <Textarea value={edited.description || ""} onChange={(e) => set("description", e.target.value)} className="text-sm resize-none" rows={3} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs mb-1 block flex items-center gap-1"><Leaf className="w-3 h-3" /> Skötselråd</Label>
                <Textarea value={edited.care_info || ""} onChange={(e) => set("care_info", e.target.value)} className="text-sm resize-none" rows={2} />
              </div>
            </div>

            {/* SEO Keywords collapsible */}
            {edited.seo_keywords?.length > 0 && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowKeywords(!showKeywords)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/20 transition-colors"
                >
                  <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> SEO-nyckelord ({edited.seo_keywords.length})</span>
                  {showKeywords ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showKeywords && (
                  <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                    {edited.seo_keywords.map((kw, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Apply button */}
            <Button onClick={handleApply} className="w-full rounded-xl gap-2">
              <CheckCircle className="w-4 h-4" /> Tillämpa och fortsätt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}