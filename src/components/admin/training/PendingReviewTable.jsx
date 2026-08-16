import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, X, GitMerge, Copy, ChevronDown, ChevronUp, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-primary/10 text-primary",
  imported: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  duplicate: "bg-muted text-muted-foreground"
};

export default function PendingReviewTable({ examples, sellers, onRefresh }) {
  const [expanded, setExpanded] = useState(null);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(null);

  const getEdit = (id, field, fallback) => edits[id]?.[field] ?? fallback;
  const setEdit = (id, field, value) =>
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));

  const handleAction = async (example, action) => {
    setSaving(example.id);
    try {
      if (action === "import") {
        const ed = edits[example.id] || {};
        await base44.functions.invoke("aiProductTrainer", {
          action: "import_product",
          example_id: example.id,
          product_data: {
            product_title: ed.expected_product_name || example.expected_product_name,
            plant_name: ed.expected_product_name || example.expected_product_name,
            scientific_name: ed.expected_scientific_name || example.expected_scientific_name,
            category: ed.expected_category || example.expected_category,
            price: parseFloat(ed.expected_price ?? example.expected_price) || 0,
            regular_price: parseFloat(ed.expected_regular_price ?? example.expected_regular_price) || null,
            product_url: ed.expected_product_url || example.expected_product_url,
            image_url: ed.expected_image_url || example.expected_image_url,
            pot_size: ed.expected_pot_size || example.expected_pot_size,
            availability: ed.expected_availability || example.expected_availability || "in_stock",
            seller_id: ed.seller_id || example.seller_id || sellers[0]?.id || "",
            description: ed.expected_description || example.expected_description
          }
        });
      } else {
        await base44.functions.invoke("aiProductTrainer", {
          action: "update_example",
          example_id: example.id,
          updates: {
            status: action === "reject" ? "rejected" : action === "duplicate" ? "duplicate" : "approved",
            admin_correction: JSON.stringify(edits[example.id] || {})
          }
        });
      }
      onRefresh?.();
    } finally {
      setSaving(null);
    }
  };

  if (!examples.length) return (
    <div className="text-center py-16 text-muted-foreground text-sm">
      Inga produkter att granska.
    </div>
  );

  return (
    <div className="space-y-2">
      {examples.map((ex) => {
        const isOpen = expanded === ex.id;
        const isSaving = saving === ex.id;
        const sellerName = sellers.find(s => s.id === ex.seller_id)?.seller_name || ex.expected_seller;

        return (
          <div key={ex.id} className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            {/* Row header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpanded(isOpen ? null : ex.id)}
            >
              {ex.image_url || ex.expected_image_url ? (
                <img src={ex.image_url || ex.expected_image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg">🌿</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {ex.expected_product_name || "Okänd produkt"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {ex.expected_scientific_name && <em>{ex.expected_scientific_name} · </em>}
                  {sellerName && <span>{sellerName} · </span>}
                  {ex.expected_price ? `${ex.expected_price} SEK` : ""}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[ex.status] || STATUS_COLORS.pending}`}>
                {ex.status}
              </span>
              {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>

            {/* Expanded edit panel */}
            {isOpen && (
              <div className="border-t border-border/40 px-4 py-4 space-y-4 bg-muted/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: "expected_product_name", label: "Produktnamn" },
                    { key: "expected_scientific_name", label: "Vetenskapligt namn" },
                    { key: "expected_price", label: "Pris (SEK)", type: "number" },
                    { key: "expected_regular_price", label: "Ord. pris (SEK)", type: "number" },
                    { key: "expected_product_url", label: "Produkt URL" },
                    { key: "expected_image_url", label: "Bild URL" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                      <Input
                        type={type || "text"}
                        value={getEdit(ex.id, key, ex[key] || "")}
                        onChange={(e) => setEdit(ex.id, key, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Kategori</label>
                    <Select
                      value={getEdit(ex.id, "expected_category", ex.expected_category || "")}
                      onValueChange={(v) => setEdit(ex.id, "expected_category", v)}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Välj..." /></SelectTrigger>
                      <SelectContent>
                        {["tropical","succulent","cactus","fern","orchid","palm","herb","tree","climbing","other"].map(c =>
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Butik</label>
                    <Select
                      value={getEdit(ex.id, "seller_id", ex.seller_id || "")}
                      onValueChange={(v) => setEdit(ex.id, "seller_id", v)}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Välj butik..." /></SelectTrigger>
                      <SelectContent>
                        {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.seller_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Krukstorlek</label>
                    <Select
                      value={getEdit(ex.id, "expected_pot_size", ex.expected_pot_size || "")}
                      onValueChange={(v) => setEdit(ex.id, "expected_pot_size", v)}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Välj..." /></SelectTrigger>
                      <SelectContent>
                        {["6cm","9cm","12cm","14cm","17cm","19cm","21cm","24cm","27cm","30cm+"].map(s =>
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {ex.expected_product_url && (
                  <a href={ex.expected_product_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" /> Visa produkt
                  </a>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" onClick={() => handleAction(ex, "import")} disabled={isSaving} className="rounded-lg gap-1.5">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Godkänn & importera
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(ex, "approve")} disabled={isSaving} className="rounded-lg gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" /> Godkänn utan import
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(ex, "duplicate")} disabled={isSaving} className="rounded-lg gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Markera duplikat
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction(ex, "reject")} disabled={isSaving} className="rounded-lg gap-1.5 text-destructive hover:text-destructive">
                    <X className="w-3.5 h-3.5" /> Avvisa
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}