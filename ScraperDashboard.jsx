import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Bot, Zap } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function ScraperDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runType, setRunType] = useState("manual");
  const [lastResult, setLastResult] = useState(null);

  const loadLogs = async () => {
    const data = await base44.entities.ScraperLog.list("-created_date", 20);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const handleRun = async (type = runType, aiMatching = true) => {
    setRunning(true);
    setLastResult(null);
    const res = await base44.functions.invoke("aiScraper", {
      run_type: type,
      ai_matching: aiMatching,
    });
    setLastResult(res.data);
    setRunning(false);
    loadLogs();
  };

  const handleScrapeAllStores = async (forceAll = false) => {
    setRunning(true);
    setLastResult(null);
    try {
      const res = await base44.functions.invoke("scrapeAllStores", { force_all: forceAll });
      setLastResult({
        ...res.data,
        new_plants: res.data?.products_found || 0,
        updated: 0,
        failed: 0,
        robots_skipped: 0,
        duplicates_detected: 0,
        matched_plants: 0,
        all_stores: true,
      });
    } catch (e) {
      setLastResult({ error: e.message });
    }
    setRunning(false);
    loadLogs();
  };

  const handleBlomsterlandetScrape = async (batch = null) => {
    setRunning(true);
    setLastResult(null);
    const payload = batch !== null ? { batch, batch_size: 5 } : {};
    const res = await base44.functions.invoke("scrapeBlomsterlandet", payload);
    setLastResult({ ...res.data, updated: res.data?.updated, new_plants: res.data?.created });
    setRunning(false);
    loadLogs();
  };

  const handlePlantagenScrape = async (batch = null) => {
    setRunning(true);
    setLastResult(null);
    const payload = batch !== null ? { batch, batch_size: 4 } : {};
    const res = await base44.functions.invoke("scrapePlantagen", payload);
    setLastResult({ ...res.data, updated: res.data?.updated, new_plants: res.data?.created });
    setRunning(false);
    loadLogs();
  };

  const statusIcon = (status) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-primary" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const statusColor = (status) => {
    if (status === "completed") return "bg-primary/10 text-primary";
    if (status === "failed") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-card rounded-2xl border border-border/60 p-6">
        <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" /> AI Scraper Kontroll
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleRun("manual", true)}
            disabled={running}
            className="rounded-xl gap-2"
          >
            <Zap className="w-4 h-4" />
            {running ? "Kör..." : "Kör med AI-matchning"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRun("manual", false)}
            disabled={running}
            className="rounded-xl gap-2"
          >
            <Play className="w-4 h-4" />
            Kör utan AI (snabbt)
          </Button>
          <Button
            onClick={() => handleScrapeAllStores(false)}
            disabled={running}
            className="rounded-xl gap-2 bg-accent hover:bg-accent/90"
          >
            <Bot className="w-4 h-4" />
            {running ? "Skrapar..." : "Skrapa alla butiker"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleScrapeAllStores(true)}
            disabled={running}
            className="rounded-xl gap-2 border-accent/40 text-accent hover:bg-accent/5"
          >
            <RefreshCw className="w-4 h-4" />
            Tvinga alla
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBlomsterlandetScrape(0)}
            disabled={running}
            className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            🌸 Blomsterlandet Batch 1
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBlomsterlandetScrape(1)}
            disabled={running}
            className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            🌿 Blomsterlandet Batch 2
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBlomsterlandetScrape(2)}
            disabled={running}
            className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            🌳 Blomsterlandet Batch 3
          </Button>
          <Button
            variant="outline"
            onClick={() => handleBlomsterlandetScrape(3)}
            disabled={running}
            className="rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            🍓 Blomsterlandet Batch 4
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={loadLogs}
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Plantagen buttons */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground self-center">🌱 Plantagen.se:</span>
          {[0, 1, 2, 3, 4].map((batch) => (
            <Button
              key={batch}
              variant="outline"
              onClick={() => handlePlantagenScrape(batch)}
              disabled={running}
              className="rounded-xl gap-2 border-green-600/30 text-green-700 hover:bg-green-500/5"
            >
              Batch {batch + 1}
            </Button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
          <p>⚡ Respekterar robots.txt · 2s fördröjning · Loggar all aktivitet</p>
          <p className="mt-1">🤖 AI-matchning identifierar samma växt hos olika butiker automatiskt</p>
          <p className="mt-1">🔄 "Skrapa alla butiker" kör 4 butiker per gång — schemalagd var 6:e timme automatiskt</p>
        </div>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="bg-card rounded-2xl border border-primary/20 p-5 bg-primary/5">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" /> Senaste körning
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            {[
              { label: lastResult.all_stores ? "Butiker" : "Uppdaterade", value: lastResult.all_stores ? (lastResult.results?.length || 0) : (lastResult.updated || 0) },
              { label: "Misslyckades", value: lastResult.failed || 0 },
              { label: "Robots-skip", value: lastResult.robots_skipped || 0 },
              { label: "Dubbletter", value: lastResult.duplicates_detected || 0 },
              { label: lastResult.all_stores ? "Produkter" : "Nya växter", value: lastResult.new_plants || 0 },
              { label: "Matchade", value: lastResult.matched_plants || 0 },
            ].map((s) => (
              <div key={s.label} className="bg-background rounded-xl p-2">
                <div className="font-display text-xl text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs table */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="font-display text-base text-foreground">Körningslogg</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Inga körningar ännu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Typ</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Kontrollerade</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Uppdaterade</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Dubbletter</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Växter matchade</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Starttid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(log.status)}
                        <Badge className={`text-xs rounded-md border-0 ${statusColor(log.status)}`}>
                          {log.status === "completed" ? "Klar" : log.status === "failed" ? "Fel" : "Kör"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{log.run_type}</td>
                    <td className="px-4 py-3 text-right text-foreground">{log.products_checked ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-foreground">{log.products_updated ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{log.duplicates_detected ?? 0}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{log.plants_matched ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {log.started_at
                        ? format(new Date(log.started_at), "d MMM HH:mm", { locale: sv })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule info */}
      <div className="bg-card rounded-2xl border border-border/60 p-5">
        <h3 className="font-display text-base text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" /> Schemalagda körningar
        </h3>
        <div className="space-y-2 text-sm">
          {[
            { schedule: "Dagligen 03:00", type: "daily", desc: "Uppdaterar alla priser" },
            { schedule: "Veckovis måndag 04:00", type: "weekly", desc: "Full genomsökning + AI-matchning" },
            { schedule: "Månadsvis den 1:a", type: "monthly", desc: "Komplett databasrensning" },
          ].map((s) => (
            <div key={s.type} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <span className="font-medium text-foreground">{s.schedule}</span>
                <span className="text-muted-foreground ml-2">— {s.desc}</span>
              </div>
              <Badge variant="secondary" className="text-xs rounded-md">{s.type}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Automationer konfigureras under Admin → Automations i Base44 dashboarden.
        </p>
      </div>
    </div>
  );
}