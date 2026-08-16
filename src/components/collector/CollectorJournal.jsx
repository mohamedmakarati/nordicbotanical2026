import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Save, BookOpen, Camera, Sprout, Scissors,
  AlertTriangle, Trophy, Droplets, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const ENTRY_TYPES = [
  { value: "care", label: "Skötsel", icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "growth", label: "Tillväxt", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { value: "repot", label: "Omplantering", icon: Sprout, color: "text-amber-600", bg: "bg-amber-500/10" },
  { value: "propagation", label: "Förökning", icon: Scissors, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "problem", label: "Problem", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  { value: "milestone", label: "Milstolpe", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "photo", label: "Foto", icon: Camera, color: "text-muted-foreground", bg: "bg-muted" },
];

export default function CollectorJournal({ userId, plants, isOwnProfile }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    user_plant_id: "", entry_type: "care", title: "", notes: "",
    entry_date: new Date().toISOString().slice(0, 10), height_cm: "", leaf_count: ""
  });

  useEffect(() => {
    base44.entities.PlantJournal.filter({ user_id: userId }, "-entry_date")
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [userId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("photo_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    const data = { ...form, user_id: userId };
    if (data.height_cm) data.height_cm = Number(data.height_cm);
    if (data.leaf_count) data.leaf_count = Number(data.leaf_count);
    const created = await base44.entities.PlantJournal.create(data);
    setEntries((prev) => [created, ...prev]);
    setShowForm(false);
    setForm({ user_plant_id: "", entry_type: "care", title: "", notes: "", entry_date: new Date().toISOString().slice(0, 10), height_cm: "", leaf_count: "" });
  };

  const getPlantName = (plantId) => plants.find((p) => p.id === plantId)?.plant_name || "Okänd växt";
  const getEntryType = (type) => ENTRY_TYPES.find((t) => t.value === type) || ENTRY_TYPES[0];

  // Group by month for timeline
  const grouped = entries.reduce((acc, entry) => {
    const month = entry.entry_date ? entry.entry_date.slice(0, 7) : "unknown";
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {});

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      {isOwnProfile && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl gap-2 text-sm">
            <Plus className="w-4 h-4" /> Ny journalpost
          </Button>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl border border-primary/30 p-5 mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base">Ny journalpost</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>

            {/* Entry type */}
            <div className="flex flex-wrap gap-2">
              {ENTRY_TYPES.map((t) => (
                <button key={t.value} onClick={() => set("entry_type", t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                    form.entry_type === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}>
                  <t.icon className="w-3 h-3" /> {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={form.user_plant_id} onChange={(e) => set("user_plant_id", e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Välj växt...</option>
                {plants.map((p) => <option key={p.id} value={p.id}>{p.plant_name}</option>)}
              </select>
              <Input type="date" value={form.entry_date} onChange={(e) => set("entry_date", e.target.value)} className="rounded-xl" />
            </div>
            <Input placeholder="Titel (valfritt)" value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="rounded-xl" />
            <textarea rows={3} placeholder="Anteckningar..." value={form.notes || ""} onChange={(e) => set("notes", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring" />

            {form.entry_type === "growth" && (
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Höjd (cm)" value={form.height_cm || ""} onChange={(e) => set("height_cm", e.target.value)} className="rounded-xl" />
                <Input type="number" placeholder="Antal blad" value={form.leaf_count || ""} onChange={(e) => set("leaf_count", e.target.value)} className="rounded-xl" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/40">
                <Camera className="w-3.5 h-3.5" /> {uploading ? "Laddar..." : "Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
              {form.photo_url && <img src={form.photo_url} alt="" className="w-10 h-10 object-cover rounded-lg" />}
              <Button onClick={handleSave} className="ml-auto rounded-xl gap-2 text-sm"><Save className="w-3.5 h-3.5" />Spara</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          Ingen journal ännu.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([month, monthEntries]) => (
            <div key={month}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                {month !== "unknown" ? format(new Date(month + "-01"), "MMMM yyyy", { locale: sv }) : "Okänt datum"}
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />
                <div className="space-y-4 pl-10">
                  {monthEntries.map((entry, i) => {
                    const et = getEntryType(entry.entry_type);
                    return (
                      <motion.div key={entry.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="relative bg-card rounded-2xl border border-border/60 p-4">
                        {/* Timeline dot */}
                        <div className={`absolute -left-6 top-4 w-4 h-4 rounded-full ${et.bg} border-2 border-background flex items-center justify-center`}>
                          <et.icon className={`w-2 h-2 ${et.color}`} />
                        </div>
                        <div className="flex items-start gap-3">
                          {entry.photo_url && (
                            <img src={entry.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={`${et.bg} ${et.color} border-0 text-[10px] px-1.5 py-0 rounded-md gap-1`}>
                                <et.icon className="w-2.5 h-2.5" /> {et.label}
                              </Badge>
                              {entry.user_plant_id && (
                                <span className="text-xs text-muted-foreground">{getPlantName(entry.user_plant_id)}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString("sv-SE") : ""}
                              </span>
                            </div>
                            {entry.title && <p className="font-medium text-sm text-foreground">{entry.title}</p>}
                            {entry.notes && <p className="text-sm text-muted-foreground mt-0.5">{entry.notes}</p>}
                            {(entry.height_cm || entry.leaf_count) && (
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                {entry.height_cm && <span>📏 {entry.height_cm} cm</span>}
                                {entry.leaf_count && <span>🌿 {entry.leaf_count} blad</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}