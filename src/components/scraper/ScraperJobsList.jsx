import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Globe, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const STATUS_CONFIG = {
  pending:      { label: "Väntar",        color: "bg-muted text-muted-foreground",        icon: Clock },
  running:      { label: "Kör...",         color: "bg-blue-100 text-blue-700",             icon: RefreshCw },
  completed:    { label: "Klar",           color: "bg-primary/10 text-primary",            icon: CheckCircle },
  failed:       { label: "Misslyckades",   color: "bg-destructive/10 text-destructive",    icon: XCircle },
  needs_review: { label: "Kräver granskning", color: "bg-amber-100 text-amber-700",        icon: AlertTriangle },
};

const CAT_LABELS = {
  plant_shop: "Växtbutik", nursery: "Plantskola", wholesaler: "Grossist", garden_center: "Trädgårdscenter"
};

export default function ScraperJobsList({ onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ScraperJob.list("-created_date", 50);
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
        <h3 className="font-display text-base text-foreground">Skrapningsjobb</h3>
        <Button variant="ghost" size="icon" onClick={load} className="rounded-xl h-8 w-8">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="p-5 space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Globe className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Inga jobb ännu. Lägg till en webbplats att skrapa.
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={job.id} className="px-5 py-4 hover:bg-muted/20 transition-colors flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">{job.seller_name}</span>
                    <Badge className={`text-[10px] rounded-md border-0 px-2 py-0.5 ${cfg.color} flex items-center gap-1`}>
                      <Icon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{job.website_url}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>{CAT_LABELS[job.seller_category] || job.seller_category}</span>
                    {job.products_found > 0 && <span>· {job.products_found} produkter hittade</span>}
                    {job.products_pending > 0 && <span className="text-amber-600">· {job.products_pending} väntar</span>}
                    {job.robots_allowed === false && <span className="text-destructive">· Blockerad av robots.txt</span>}
                    {job.created_date && (
                      <span>· {format(new Date(job.created_date), "d MMM HH:mm", { locale: sv })}</span>
                    )}
                  </div>
                </div>
                {(job.status === "needs_review" || job.status === "completed") && (
                  <Button variant="outline" size="sm" onClick={() => onSelectJob?.(job)} className="rounded-xl gap-1.5 text-xs shrink-0">
                    <Eye className="w-3.5 h-3.5" /> Granska
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}