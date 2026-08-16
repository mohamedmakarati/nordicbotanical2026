import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | "uploading" | "processing" | "done" | "error"
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("uploading");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setStatus("processing");

    const sellers = await base44.entities.Seller.list();
    const sellersMap = Object.fromEntries(sellers.map((s) => [s.seller_name.toLowerCase(), s.id]));

    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_title: { type: "string" },
                price: { type: "number" },
                regular_price: { type: "number" },
                currency: { type: "string" },
                product_url: { type: "string" },
                image_url: { type: "string" },
                pot_size: { type: "string" },
                availability: { type: "string" },
                seller: { type: "string" },
                shipping_cost: { type: "number" },
              },
            },
          },
        },
      },
    });

    if (extracted.status !== "success" || !extracted.output?.products) {
      setStatus("error");
      setResult({ message: extracted.details || "Kunde inte läsa filen." });
      return;
    }

    const rows = extracted.output.products;
    const toCreate = rows.map((row) => ({
      product_title: row.product_title || "Okänd produkt",
      price: row.price || 0,
      regular_price: row.regular_price || null,
      currency: row.currency || "SEK",
      product_url: row.product_url || "#",
      image_url: row.image_url || null,
      pot_size: row.pot_size || null,
      availability: row.availability === "in_stock" ? "in_stock" : "in_stock",
      seller_id: sellersMap[row.seller?.toLowerCase()] || sellers[0]?.id || "",
      shipping_cost: row.shipping_cost || 49,
      total_price: (row.price || 0) + (row.shipping_cost || 49),
      last_checked: new Date().toISOString(),
    })).filter((r) => r.product_title && r.price > 0);

    await base44.entities.Product.bulkCreate(toCreate);
    setStatus("done");
    setResult({ count: toCreate.length });
  };

  return (
    <div className="max-w-xl">
      <h3 className="font-display text-lg text-foreground mb-1">Importera produkter</h3>
      <p className="text-sm text-muted-foreground mb-6">Ladda upp en CSV- eller Excel-fil med produktdata. Systemet mappar fälten automatiskt med AI.</p>

      <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-4 relative hover:border-primary/40 transition-colors">
        <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {file ? <span className="text-foreground font-medium">{file.name}</span> : "Dra & släpp en fil här, eller klicka för att välja"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">CSV, Excel eller JSON stöds</p>
      </div>

      <Button
        onClick={handleImport}
        disabled={!file || status === "uploading" || status === "processing"}
        className="w-full rounded-xl gap-2"
      >
        <Upload className="w-4 h-4" />
        {status === "uploading" ? "Laddar upp..." : status === "processing" ? "Bearbetar med AI..." : "Importera"}
      </Button>

      {status === "done" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4" />
          {result.count} produkter importerade!
        </div>
      )}
      {status === "error" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />
          {result.message}
        </div>
      )}
    </div>
  );
}