import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, Leaf, Upload, ImageIcon, ClipboardList, BarChart2 } from "lucide-react";
import FileUploadTrainer from "@/components/admin/training/FileUploadTrainer";
import ImageUploadTrainer from "@/components/admin/training/ImageUploadTrainer";
import ImageAnalysisResult from "@/components/admin/training/ImageAnalysisResult";
import PendingReviewTable from "@/components/admin/training/PendingReviewTable";
import TrainingStatsBar from "@/components/admin/training/TrainingStatsBar";

export default function AIProductTraining() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [examples, setExamples] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, imported: 0, approved: 0, rejected: 0, duplicate: 0 });
  const [tab, setTab] = useState("upload_file");
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setRefreshing(true);
    const [s, e, statsRes] = await Promise.all([
      base44.entities.Seller.list(),
      base44.entities.AITrainingExample.list("-created_date", 200),
      base44.functions.invoke("aiProductTrainer", { action: "get_stats" }).catch(() => ({ data: { stats: {} } }))
    ]);
    setSellers(s);
    setExamples(e);
    setStats(statsRes.data?.stats || {});
    setRefreshing(false);
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user || user.role !== "admin") return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-foreground mb-2">Åtkomst nekad</h2>
          <p className="text-muted-foreground text-sm">Endast admins kan se AI-träningssidan.</p>
        </div>
      </div>
    </div>
  );

  const pending = examples.filter(e => e.status === "pending");
  const imported = examples.filter(e => e.status === "imported");
  const rejected = examples.filter(e => e.status === "rejected");
  const duplicates = examples.filter(e => e.status === "duplicate");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-foreground">AI Produktträning</h1>
              <p className="text-sm text-muted-foreground">Ladda upp filer & bilder — AI extraherar och lär sig</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing} className="rounded-xl gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Uppdatera
          </Button>
        </div>

        {/* Stats */}
        <TrainingStatsBar stats={stats} />

        {/* Main tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-xl mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="upload_file" className="rounded-lg gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Ladda upp fil
            </TabsTrigger>
            <TabsTrigger value="upload_image" className="rounded-lg gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Ladda upp bild
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-lg gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Granska AI
              {pending.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Historik
            </TabsTrigger>
          </TabsList>

          {/* Upload file tab */}
          <TabsContent value="upload_file">
            <div className="max-w-xl mx-auto">
              <h2 className="font-display text-lg text-foreground mb-1">Ladda upp produktfil</h2>
              <p className="text-sm text-muted-foreground mb-5">
                AI läser CSV, Excel eller JSON och extraherar produktnamn, priser, kategorier och mer. 
                Produkterna hamnar i "Granska AI" för din godkännande innan import.
              </p>
              <FileUploadTrainer
                onBatchCreated={(batchId, count) => {
                  loadData();
                  setTab("review");
                }}
              />
            </div>
          </TabsContent>

          {/* Upload image tab */}
          <TabsContent value="upload_image">
            <div className="max-w-xl mx-auto">
              <h2 className="font-display text-lg text-foreground mb-1">Identifiera växt från bild</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Ladda upp en växtbild. AI analyserar arten, föreslår produkttitel, beskrivning och prisintervall.
              </p>
              {imageAnalysis ? (
                <div className="space-y-4">
                  <ImageAnalysisResult
                    analysis={imageAnalysis.analysis}
                    exampleId={imageAnalysis.exampleId}
                    imageUrl={imageAnalysis.imageUrl}
                    sellers={sellers}
                    onDone={() => { setImageAnalysis(null); loadData(); }}
                  />
                  <Button variant="outline" size="sm" onClick={() => setImageAnalysis(null)} className="rounded-xl">
                    Analysera ny bild
                  </Button>
                </div>
              ) : (
                <ImageUploadTrainer
                  onAnalysisDone={(analysis, exampleId, imageUrl) => {
                    setImageAnalysis({ analysis, exampleId, imageUrl });
                  }}
                />
              )}
            </div>
          </TabsContent>

          {/* Review tab */}
          <TabsContent value="review">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-foreground">
                  Granska AI-extraherade produkter
                  {pending.length > 0 && <span className="ml-2 text-amber-600 text-base">({pending.length} väntar)</span>}
                </h2>
              </div>
              <PendingReviewTable
                examples={pending}
                sellers={sellers}
                onRefresh={loadData}
              />
            </div>
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history">
            <div>
              <h2 className="font-display text-lg text-foreground mb-4">Importhistorik</h2>
              <Tabs defaultValue="imported">
                <TabsList className="rounded-xl mb-4">
                  <TabsTrigger value="imported" className="rounded-lg">Importerade ({imported.length})</TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-lg">Avvisade ({rejected.length})</TabsTrigger>
                  <TabsTrigger value="duplicates" className="rounded-lg">Duplikat ({duplicates.length})</TabsTrigger>
                </TabsList>

                {[
                  { value: "imported", data: imported },
                  { value: "rejected", data: rejected },
                  { value: "duplicates", data: duplicates }
                ].map(({ value, data }) => (
                  <TabsContent key={value} value={value}>
                    {data.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">Inga poster.</div>
                    ) : (
                      <div className="space-y-2">
                        {data.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-3 bg-card border border-border/40 rounded-xl px-4 py-3">
                            {(ex.image_url || ex.expected_image_url) && (
                              <img src={ex.image_url || ex.expected_image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 bg-muted" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ex.expected_product_name || "Okänd"}</p>
                              <p className="text-xs text-muted-foreground">
                                {ex.expected_price ? `${ex.expected_price} SEK · ` : ""}
                                {ex.file_name || ex.input_type}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(ex.created_date).toLocaleDateString("sv-SE")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}