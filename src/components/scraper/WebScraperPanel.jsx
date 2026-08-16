import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddScraperJob from "./AddScraperJob";
import ScraperJobsList from "./ScraperJobsList";
import ScraperResultsReview from "./ScraperResultsReview";
import { Globe, ClipboardList, Clock, CheckCircle, XCircle, Copy } from "lucide-react";

function DuplicatesView() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ScraperResult.filter({ is_duplicate: true, status: "pending" }, "-created_date", 50)
      .then(setResults).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 bg-muted rounded-2xl animate-pulse" />;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6">
      <h3 className="font-display text-base text-foreground mb-4">Identifierade dubbletter ({results.length})</h3>
      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Inga dubbletter hittades.</p>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{r.product_name}</p>
                <p className="text-xs text-muted-foreground">{r.seller_name} · {r.price} SEK</p>
              </div>
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">Dubblett</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WebScraperPanel() {
  const [activeTab, setActiveTab] = useState("add");
  const [selectedJob, setSelectedJob] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleJobCreated = () => {
    setRefreshKey((k) => k + 1);
    setActiveTab("jobs");
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setActiveTab("pending");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl text-foreground">AI Webbplatsskrapare</h2>
          <p className="text-xs text-muted-foreground">Importera växtprodukter från valfri webbplats med AI</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl h-auto flex-wrap gap-1">
          <TabsTrigger value="add" className="rounded-lg text-xs gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Lägg till
          </TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg text-xs gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Jobb
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg text-xs gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Väntar
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg text-xs gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Godkända
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg text-xs gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Avvisade
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="rounded-lg text-xs gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Dubbletter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-4">
          <AddScraperJob onJobCreated={handleJobCreated} />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <ScraperJobsList key={refreshKey} onSelectJob={handleSelectJob} />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {selectedJob && (
            <div className="mb-3 px-4 py-2 bg-muted/40 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Visar resultat för: <span className="font-medium text-foreground">{selectedJob.seller_name}</span>
              <button onClick={() => setSelectedJob(null)} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          <ScraperResultsReview jobId={selectedJob?.id} filterStatus="pending" />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <ScraperResultsReview filterStatus="approved" />
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <ScraperResultsReview filterStatus="rejected" />
        </TabsContent>

        <TabsContent value="duplicates" className="mt-4">
          <DuplicatesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}