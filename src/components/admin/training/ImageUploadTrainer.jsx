import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function ImageUploadTrainer({ onAnalysisDone }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStatus("analyzing");
      const res = await base44.functions.invoke("aiProductTrainer", {
        action: "analyze_image",
        image_url: file_url
      });
      if (res.data?.error) throw new Error(res.data.error);
      setStatus("done");
      onAnalysisDone?.(res.data.analysis, res.data.example_id, file_url);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Kunde inte analysera bilden");
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        } ${preview ? "p-0" : "p-10"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full max-h-64 object-contain bg-muted/20" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <p className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">Byt bild</p>
            </div>
          </div>
        ) : (
          <>
            <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Ladda upp växtbild</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP</p>
          </>
        )}
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!file || status === "uploading" || status === "analyzing"}
        className="w-full rounded-xl gap-2"
      >
        {status === "uploading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Laddar upp...</>
          : status === "analyzing" ? <><Loader2 className="w-4 h-4 animate-spin" /> AI identifierar växten...</>
          : <><Sparkles className="w-4 h-4" /> Identifiera med AI</>}
      </Button>

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}