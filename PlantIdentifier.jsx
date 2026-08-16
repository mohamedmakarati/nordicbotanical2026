import { useState, useRef } from "react";
import { Camera, Upload, Leaf, Droplets, Sun, Stethoscope, ShoppingCart, X, Loader2, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function PlantIdentifier() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setResult(null);
    setError(null);
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImageUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setShowMoreSuggestions(false);

    // Convert image to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result); // data:image/...;base64,...
      reader.readAsDataURL(image);
    });

    const res = await base44.functions.invoke('plantIdentify', { image_base64: base64 });
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setResult(res.data);
    }
    setLoading(false);
  };

  const clear = () => {
    setImage(null);
    setImageUrl(null);
    setResult(null);
    setError(null);
  };

  // Parse top suggestion
  const topSuggestion = result?.result?.classification?.suggestions?.[0];
  const otherSuggestions = result?.result?.classification?.suggestions?.slice(1, 4) || [];
  const isPlant = result?.result?.is_plant?.binary;
  const isHealthy = result?.result?.is_healthy;
  const diseases = result?.result?.disease?.suggestions?.filter(d => d.probability > 0.05) || [];

  const healthColor = isHealthy?.binary
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-amber-100 text-amber-700 border-amber-200";
  const healthLabel = isHealthy?.binary ? "Frisk" : "Behöver kontroll";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/8 to-background py-14 border-b border-border/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
              <Camera className="w-3.5 h-3.5" /> Drivs av Plant.id v3
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
              Identifiera din växt
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Ladda upp ett foto — AI returnerar växtnamn, hälsodiagnos och skötselguide.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Upload */}
            <div>
              <h2 className="font-display text-xl text-foreground mb-4">Ladda upp ett foto</h2>

              {!imageUrl ? (
                <div
                  className={`relative border-2 border-dashed rounded-3xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-display text-lg text-foreground mb-1">Dra hit ett foto</p>
                  <p className="text-sm text-muted-foreground mb-4">eller klicka för att välja</p>
                  <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP · Max 10 MB</p>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden aspect-square border border-border/50">
                  <img src={imageUrl} alt="Uppladdad växt" className="w-full h-full object-cover" />
                  <button
                    onClick={clear}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <Button
                      onClick={analyze}
                      disabled={loading}
                      size="lg"
                      className="w-full rounded-2xl h-12 gap-2 bg-white text-primary hover:bg-white/90 font-semibold"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyserar...</>
                      ) : (
                        <><Leaf className="w-4 h-4" /> Identifiera växt</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 rounded-2xl bg-muted/40 border border-border/40">
                <p className="text-xs font-semibold text-foreground mb-2">Tips för bästa resultat</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Ta ett foto av ett löv eller hela växten</li>
                  <li>• Se till att bilden är skarp och välbelyst</li>
                  <li>• Inkludera blommor eller frukter om möjligt</li>
                  <li>• Undvik bakgrund som distraherar</li>
                </ul>
              </div>
            </div>

            {/* Results */}
            <div>
              <h2 className="font-display text-xl text-foreground mb-4">Analysresultat</h2>

              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="rounded-3xl border border-border/50 bg-card p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    </div>
                    <p className="font-display text-lg text-foreground">Plant.id analyserar...</p>
                    <p className="text-sm text-muted-foreground text-center">Identifierar art, sjukdomar och skötselråd</p>
                  </motion.div>
                )}

                {error && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-3xl border border-red-200 bg-red-50 p-6 flex flex-col items-center gap-3 text-center min-h-[200px] justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <p className="font-display text-base text-red-700">Något gick fel</p>
                    <p className="text-sm text-red-500">{error}</p>
                  </motion.div>
                )}

                {!loading && !result && !error && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-3xl border-2 border-dashed border-border/40 p-8 flex flex-col items-center justify-center min-h-[400px] gap-3 text-center">
                    <Leaf className="w-10 h-10 text-muted-foreground/30" />
                    <p className="font-display text-base text-foreground">Ladda upp ett foto för att börja</p>
                    <p className="text-sm text-muted-foreground">AI identifierar din växt på sekunder</p>
                  </motion.div>
                )}

                {!loading && result && (
                  <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="space-y-4">

                    {/* Not a plant */}
                    {isPlant === false && (
                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-700">Bilden verkar inte innehålla en växt. Prova ett tydligare foto.</p>
                      </div>
                    )}

                    {/* Top identification */}
                    {topSuggestion && (
                      <div className="p-5 rounded-2xl bg-card border border-border/50">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-display text-xl text-foreground">
                              {topSuggestion.details?.common_names?.[0] || topSuggestion.name}
                            </h3>
                            <p className="text-sm text-muted-foreground italic">{topSuggestion.name}</p>
                            {topSuggestion.details?.common_names?.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Även: {topSuggestion.details.common_names.slice(1, 3).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground mb-0.5">Säkerhet</div>
                            <div className="font-display text-lg text-primary">
                              {Math.round(topSuggestion.probability * 100)}%
                            </div>
                          </div>
                        </div>

                        {topSuggestion.details?.description?.value && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {topSuggestion.details.description.value.slice(0, 200)}
                            {topSuggestion.details.description.value.length > 200 ? '…' : ''}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {isHealthy !== undefined && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${healthColor}`}>
                              {healthLabel}
                            </span>
                          )}
                          {topSuggestion.details?.url && (
                            <a href={topSuggestion.details.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                              Wikipedia <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Similar images */}
                        {topSuggestion.similar_images?.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {topSuggestion.similar_images.slice(0, 4).map((img, i) => (
                              <img key={i} src={img.url_small || img.url} alt="Liknande" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border/50" />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Care */}
                    {topSuggestion?.details && (
                      <div className="p-5 rounded-2xl bg-card border border-border/50">
                        <h4 className="font-display text-sm text-foreground mb-3">Skötselguide</h4>
                        <div className="space-y-2.5">
                          {topSuggestion.details.best_watering && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Droplets className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Vattning: </span>
                                <span className="text-xs text-foreground">{topSuggestion.details.best_watering}</span>
                              </div>
                            </div>
                          )}
                          {topSuggestion.details.best_light_condition && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Sun className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Ljus: </span>
                                <span className="text-xs text-foreground">{topSuggestion.details.best_light_condition}</span>
                              </div>
                            </div>
                          )}
                          {topSuggestion.details.toxicity && (
                            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed">
                              ⚠️ {topSuggestion.details.toxicity}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Health / diseases */}
                    {diseases.length > 0 && (
                      <div className="p-5 rounded-2xl bg-card border border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Stethoscope className="w-4 h-4 text-amber-600" />
                          <h4 className="font-display text-sm text-foreground">Möjliga problem</h4>
                        </div>
                        <div className="space-y-2">
                          {diseases.slice(0, 3).map((d, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-foreground">{d.name}</span>
                              <span className="text-muted-foreground shrink-0">{Math.round(d.probability * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other suggestions */}
                    {otherSuggestions.length > 0 && (
                      <div className="p-5 rounded-2xl bg-card border border-border/50">
                        <button
                          onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <h4 className="font-display text-sm text-foreground">Andra möjliga arter</h4>
                          {showMoreSuggestions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        {showMoreSuggestions && (
                          <div className="mt-3 space-y-2">
                            {otherSuggestions.map((s, i) => (
                              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                <div>
                                  <span className="text-foreground">{s.details?.common_names?.[0] || s.name}</span>
                                  {s.details?.common_names?.[0] && <span className="text-muted-foreground italic ml-1">({s.name})</span>}
                                </div>
                                <span className="text-muted-foreground shrink-0">{Math.round(s.probability * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Buy CTA */}
                    {topSuggestion && (
                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingCart className="w-4 h-4 text-primary" />
                          <h4 className="font-display text-sm text-foreground">Hitta på auktion</h4>
                        </div>
                        <Button asChild size="sm" className="w-full rounded-xl h-9 gap-2 text-xs">
                          <a href={`/search?q=${encodeURIComponent(topSuggestion.details?.common_names?.[0] || topSuggestion.name)}`}>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Sök efter {topSuggestion.details?.common_names?.[0] || topSuggestion.name}
                          </a>
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}