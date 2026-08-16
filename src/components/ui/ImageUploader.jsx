import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImageUploader({ value, onChange, className, placeholder = "Ladda upp bild", multiple = false, maxImages = 8 }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const results = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      results.push(file_url);
    }
    if (multiple) {
      onChange([...(value || []), ...results].slice(0, maxImages));
    } else {
      onChange(results[0]);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  if (!multiple) {
    return (
      <div className={cn("relative", className)}>
        {value ? (
          <div className="relative rounded-xl overflow-hidden border border-border/60 aspect-square">
            <img src={value} alt="Uppladdad bild" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange("")}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/60 hover:border-primary/40 rounded-xl p-6 cursor-pointer transition-colors bg-muted/30 hover:bg-primary/5"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">{uploading ? "Laddar upp..." : placeholder}</span>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        )}
      </div>
    );
  }

  // Multiple images
  const images = value || [];
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden border border-border/60 aspect-square">
            <img src={url} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <label
            className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border/60 hover:border-primary/40 rounded-xl aspect-square cursor-pointer transition-colors bg-muted/30 hover:bg-primary/5"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center px-1">Lägg till</span>
              </>
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{images.length}/{maxImages} bilder uppladdade</p>
    </div>
  );
}