import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, ImageIcon, Loader2, RefreshCw, X, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS = {
  tropical: "Tropisk", succulent: "Suckulenter", cactus: "Kaktus", fern: "Ormbunke",
  orchid: "Orkidé", palm: "Palm", herb: "Ört", tree: "Träd", climbing: "Klätterväxt", other: "Övrigt"
};

export default function PlantImageAIAnalyzer({ onAnalysisDone, onImageUploaded }) {
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [status, setStatus] = useState(null); // null | uploading | analyzing | done | error
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setStatus("uploading");
    setError("");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);
    onImageUploaded?.(file_url);
    setStatus("analyzing");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert botanist working for a Scandinavian plant marketplace.
Analyze this plant photo and produce structured product data for a seller listing.
Be specific and confident. Use Swedish for product title and description.

Return JSON with:
- plant_name: common name in Swedish
- scientific_name: Latin binomial (e.g. "Monstera deliciosa")
- category: one of [tropical, succulent, cactus, fern, orchid, palm, herb, tree, climbing, other]
- condition: one of [excellent, good, fair, needs_care]
- pot_size: estimated pot diameter if visible (e.g. "12cm"), null if not
- product_title: compelling 5-8 word Swedish title for the listing
- description: 2-3 sentences Swedish description highlighting key features and appeal
- care_info: 2-3 sentences about care requirements in Swedish
- seo_keywords: array of 5-8 relevant Swedish search terms
- suggested_price: typical market price in SEK (number only)
- auction_starting_price: good starting bid in SEK (usually 40-60% of suggested_price)
- confidence: 0-100 confidence score`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          plant_name: { type: "string" },
          scientific_name: { type: "string" },
          category: { type: "string" },
          condition: { type: "string" },
          pot_size: { type: "string" },
          product_title: { type: "string" },
          description: { type: "string" },
          care_info: { type: "string" },
          seo_keywords: { type: "array", items: { type: "string" } },
          suggested_price: { type: "number" },
          auction_starting_price: { type: "number" },
          confidence: { type: "number" }
        }
      }
    });

    setAnalysis(res);
    setStatus("done");
    onAnalysisDone?.(res, file_url);
  };

  const handleReset = () => {
    setPreview(null);
    setUploadedUrl(null);
    setAnalysis(null);
    setStatus(null);
    setError("");
  };

  const confidence = analysis?.confidence || 0;

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium text-foreground text-sm mb-1">Ladda upp bild — AI identifierar växten</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP · AI fyller i titel, beskrivning och pris automatiskt</p>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-muted/10">
          <img src={preview} alt="plant" className="w-full max-h-52 object-contain" />
          <button onClick={handleReset}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
          {/* Status overlay */}
          {(status === "uploading" || status === "analyzing") && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">
                {status === "uploading" ? "Laddar upp bild..." : "AI analyserar växten..."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* AI Results */}
      {status === "done" && analysis && (
        <div className="bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/20 rounded-2xl p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">AI-analys klar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                confidence >= 70 ? "bg-primary/10 text-primary" :
                confidence >= 40 ? "bg-amber-100 text-amber-700" :
                "bg-red-50 text-red-600"
              }`}>
                {confidence}% säkerhet
              </div>
              <button onClick={() => inputRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Ny bild
              </button>
            </div>
          </div>

          {/* Plant identity */}
          <div>
            <p className="font-display text-base text-foreground">{analysis.plant_name}</p>
            {analysis.scientific_name && (
              <p className="text-xs text-muted-foreground italic">{analysis.scientific_name}</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {analysis.category && (
              <Badge variant="secondary" className="text-xs rounded-lg">
                {CATEGORY_LABELS[analysis.category] || analysis.category}
              </Badge>
            )}
            {analysis.condition && (
              <Badge variant="outline" className="text-xs rounded-lg capitalize">
                {analysis.condition.replace("_", " ")}
              </Badge>
            )}
            {analysis.pot_size && (
              <Badge variant="outline" className="text-xs rounded-lg">
                Kruka {analysis.pot_size}
              </Badge>
            )}
          </div>

          {/* Product title */}
          <div className="bg-card/60 rounded-xl p-3 border border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Föreslagen titel</p>
            <p className="text-sm text-foreground font-medium">{analysis.product_title}</p>
          </div>

          {/* Description */}
          <div className="bg-card/60 rounded-xl p-3 border border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Beskrivning</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.description}</p>
          </div>

          {/* Care info */}
          {analysis.care_info && (
            <div className="bg-card/60 rounded-xl p-3 border border-border/40">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Skötselinformation</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis.care_info}</p>
            </div>
          )}

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card/60 rounded-xl p-3 border border-border/40 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Marknadspris</p>
              <p className="font-display text-lg text-foreground">{analysis.suggested_price?.toLocaleString("sv-SE")} SEK</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 text-center">
              <p className="text-[10px] text-primary/70 mb-1">Rekommenderat startbud</p>
              <p className="font-display text-lg text-primary">{analysis.auction_starting_price?.toLocaleString("sv-SE")} SEK</p>
            </div>
          </div>

          {/* SEO keywords */}
          {analysis.seo_keywords?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">SEO-nyckelord</p>
              <div className="flex flex-wrap gap-1">
                {analysis.seo_keywords.map((kw) => (
                  <span key={kw} className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            ✏️ Alla fält kan redigeras i formuläret nedan
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-sm text-destructive">
          {error || "Kunde inte analysera bilden. Försök igen."}
        </div>
      )}

      {/* Hidden re-upload input for refresh */}
      {preview && (
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { handleReset(); setTimeout(() => handleFile(e.target.files[0]), 50); }} />
      )}
    </div>
  );
}