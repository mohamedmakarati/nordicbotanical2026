import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Edit2, ExternalLink, AlertTriangle, RefreshCw, Filter } from "lucide-react";

const CATEGORY_LABELS = {
  tropical: "Tropisk", succulent: "Suckulent", cactus: "Kaktus", fern: "Ormbunke",
  orchid: "Orkidé", palm: "Palm", herb: "Ört", tree: "Träd", climbing: "Klängväxt",
  rose: "Ros", other: "Annat"
};

const AVAIL_LABELS = {
  in_stock: { label: "I lager", color: "bg-primary/10 text-primary" },
  out_of_stock: { label: "Slut", color: "bg-destructive/10 text-destructive" },
  limited: { label: "Begränsat", color: "bg-amber-100 text-amber-700" },
};

export default function ScraperResultsReview({ jobId, filterStatus = "pending" }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [statusFilter, setStatusFilter] = useState(filterStatus);
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    setLoading(true);
    const query = jobId ? { job_id: jobId, status: statusFilter } : { status: statusFilter };
    const data = await base44.entities.ScraperResult.filter(query, "-created_date", 100);
    setResults(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [jobId, statusFilter]);

  const handleApprove = async (result) => {
    setProcessing(result.id);
    // Create actual Product
    const plant = await findOrCreatePlant(result);

    await base44.entities.Product.create({
      product_title: result.product_name,
      plant_id: plant?.id,
      seller_id: result.seller_id,
      price: result.price,
      regular_price: result.regular_price || undefined,
      currency: "SEK",
      shipping_cost: 49,
      total_price: result.price + 49,
      product_url: result.product_url,
      image_url: result.image_url || undefined,
      availability: result.availability || "in_stock",
      last_checked: new Date().toISOString(),
    });

    await base44.entities.ScraperResult.update(result.id, {
      status: "approved",
    });

    // Update job counts (wrapped — job may not exist anymore)
    if (result.job_id) {
      try {
        const jobs = await base44.entities.ScraperJob.filter({ id: result.job_id });
        if (jobs[0]) {
          await base44.entities.ScraperJob.update(jobs[0].id, {
            products_approved: (jobs[0].products_approved || 0) + 1,
            products_pending: Math.max(0, (jobs[0].products_pending || 1) - 1),
          });
        }
      } catch (e) {
        // Job not found — continue, product is still approved
      }
    }

    setResults((prev) => prev.filter((r) => r.id !== result.id));
    setProcessing(null);
  };

  const handleReject = async (result) => {
    setProcessing(result.id);
    await base44.entities.ScraperResult.update(result.id, { status: "rejected" });
    setResults((prev) => prev.filter((r) => r.id !== result.id));
    setProcessing(null);
  };

  const handleSaveEdit = async (id) => {
    await base44.entities.ScraperResult.update(id, editData);
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, ...editData } : r));
    setEditingId(null);
  };

  const findOrCreatePlant = async (result) => {
    try {
      const plants = await base44.entities.Plant.filter({ plant_name: result.product_name });
      if (plants.length > 0) return plants[0];
      return await base44.entities.Plant.create({
        plant_name: result.product_name,
        scientific_name: result.scientific_name || null,
        category: result.category || "other",
        description: result.description || null,
      });
    } catch {
      return null;
    }
  };

  const approveAll = async () => {
    setProcessing("bulk");
    try {
      const res = await base44.functions.invoke("bulkApproveScraperResults", {
        job_id: jobId || null,
      });
      await load();
    } catch (e) {
      // error — reload to show current state
      await load();
    }
    setProcessing(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {s === "pending" ? "Väntar" : s === "approved" ? "Godkända" : "Avvisade"}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={load} className="rounded-lg gap-1.5 text-xs ml-auto">
          <RefreshCw className="w-3 h-3" /> Uppdatera
        </Button>
        {statusFilter === "pending" && results.length > 0 && (
          <Button size="sm" onClick={approveAll} disabled={processing === "bulk"} className="rounded-lg gap-1.5 text-xs bg-primary/90">
            <CheckCircle className="w-3 h-3" /> {processing === "bulk" ? "Godkänner..." : `Godkänn alla (${results.filter(r => !r.is_duplicate).length})`}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
          <Filter className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Inga produkter i denna status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.id} className={`bg-card rounded-2xl border overflow-hidden ${result.is_duplicate ? "border-amber-300/60" : "border-border/60"}`}>
              {result.is_duplicate && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" /> Möjlig dubblett — produkten verkar redan finnas
                </div>
              )}
              <div className="p-4 flex gap-4">
                {/* Image */}
                <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  {result.image_url ? (
                    <img src={result.image_url} alt={result.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">Bild</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === result.id ? (
                    <div className="space-y-2">
                      <Input value={editData.product_name || ""} onChange={(e) => setEditData({ ...editData, product_name: e.target.value })} placeholder="Produktnamn" className="h-7 text-sm" />
                      <Input value={editData.scientific_name || ""} onChange={(e) => setEditData({ ...editData, scientific_name: e.target.value })} placeholder="Vetenskapligt namn" className="h-7 text-sm" />
                      <div className="flex gap-2">
                        <Input type="number" value={editData.price || ""} onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })} placeholder="Pris" className="h-7 text-sm w-24" />
                        <Button size="sm" onClick={() => handleSaveEdit(result.id)} className="h-7 text-xs rounded-lg">Spara</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs rounded-lg">Avbryt</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start gap-2 mb-1">
                        <h4 className="font-medium text-sm text-foreground leading-snug">{result.product_name}</h4>
                        {result.scientific_name && <span className="text-xs text-muted-foreground italic">{result.scientific_name}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge className="text-[10px] rounded-md border-0 bg-muted text-muted-foreground">{CATEGORY_LABELS[result.category] || result.category}</Badge>
                        {result.availability && <Badge className={`text-[10px] rounded-md border-0 ${AVAIL_LABELS[result.availability]?.color}`}>{AVAIL_LABELS[result.availability]?.label}</Badge>}
                        {result.ai_confidence && (
                          <Badge className={`text-[10px] rounded-md border-0 ${result.ai_confidence >= 80 ? "bg-primary/10 text-primary" : result.ai_confidence >= 60 ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
                            AI {result.ai_confidence}%
                          </Badge>
                        )}
                        {result.pot_size && <Badge variant="outline" className="text-[10px] rounded-md">{result.pot_size}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-foreground">{result.price?.toFixed(0)} SEK</span>
                        {result.regular_price && <span className="text-muted-foreground line-through">{result.regular_price?.toFixed(0)} SEK</span>}
                        {result.discount_pct && <span className="text-destructive">-{result.discount_pct}%</span>}
                        <span className="text-muted-foreground truncate">{result.seller_name}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {statusFilter === "pending" && editingId !== result.id && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(result)} disabled={processing === result.id}
                      className="h-7 px-3 text-xs rounded-lg gap-1 bg-primary hover:bg-primary/90">
                      <CheckCircle className="w-3 h-3" /> Godkänn
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(result.id); setEditData({ ...result }); }}
                      className="h-7 px-3 text-xs rounded-lg gap-1">
                      <Edit2 className="w-3 h-3" /> Redigera
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(result)} disabled={processing === result.id}
                      className="h-7 px-3 text-xs rounded-lg gap-1 text-destructive hover:bg-destructive/10">
                      <XCircle className="w-3 h-3" /> Avvisa
                    </Button>
                    {result.product_url && (
                      <a href={result.product_url} target="_blank" rel="noopener noreferrer"
                        className="h-7 px-3 text-xs rounded-lg gap-1 flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}