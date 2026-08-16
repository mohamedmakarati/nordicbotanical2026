import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

export default function FileUploadTrainer({ onBatchCreated }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
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
        action: "analyze_file",
        file_url,
        file_name: file.name
      });
      if (res.data?.error) throw new Error(res.data.error);
      setStatus("done");
      onBatchCreated?.(res.data.batch_id, res.data.count);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Kunde inte analysera filen");
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              className="ml-2 p-1 rounded-full hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus(null); }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Dra & släpp fil här</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx) eller JSON</p>
          </>
        )}
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!file || status === "uploading" || status === "analyzing"}
        className="w-full rounded-xl gap-2"
      >
        {status === "uploading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Laddar upp...</>
          : status === "analyzing" ? <><Loader2 className="w-4 h-4 animate-spin" /> AI analyserar...</>
          : <><Upload className="w-4 h-4" /> Analysera med AI</>}
      </Button>

      {status === "done" && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Filen analyserades! Granska produkterna i "Granska AI" fliken.
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}