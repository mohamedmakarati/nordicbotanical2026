import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, BookOpen, Droplets, Scissors, Camera, Sprout, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const ENTRY_ICONS = {
  note: BookOpen, growth: Sprout, photo: Camera, repot: Scissors,
  watering: Droplets, fertilize: Sprout, treatment: Scissors,
};
const ENTRY_LABELS = {
  note: "Anteckning", growth: "Tillväxt", photo: "Foto", repot: "Omplantering",
  watering: "Vattning", fertilize: "Gödsling", treatment: "Behandling",
};
const ENTRY_COLORS = {
  note: "bg-muted text-muted-foreground", growth: "bg-primary/10 text-primary",
  photo: "bg-blue-500/10 text-blue-500", repot: "bg-purple-500/10 text-purple-500",
  watering: "bg-cyan-500/10 text-cyan-500", fertilize: "bg-emerald-500/10 text-emerald-500",
  treatment: "bg-red-500/10 text-red-500",
};

export default function PlantJournalTimeline({ userId, isOwnProfile, plants }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entry_type: "note", title: "", content: "", user_plant_id: "", height_cm: "", leaf_count: "" });
  const [uploading, setUploading] = useState(false);
  const [selectedPlantFilter, setSelectedPlantFilter] = useState("all");

  useEffect(() => {
    base44.entities.PlantJournal.filter({ user_id: userId })
      .then(data => setEntries(data.sort((a, b) => new Date(b.entry_date || b.created_date) - new Date(a.entry_date || a.created_date))))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.user_plant_id) return;
    const data = { ...form, user_id: userId, entry_date: new Date().toISOString(), height_cm: Number(form.height_cm) || undefined, leaf_count: Number(form.leaf_count) || undefined };
    const created = await base44.entities.PlantJournal.create(data);
    setEntries(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ entry_type: "note", title: "", content: "", user_plant_id: "", height_cm: "", leaf_count: "" });
  };

  const filtered = selectedPlantFilter === "all" ? entries : entries.filter(e => e.user_plant_id === selectedPlantFilter);

  if (loading) return <div className="h-24 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <select value={selectedPlantFilter} onChange={e => setSelectedPlantFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="all">Alla växter</option>
          {plants.map(p => <option key={p.id} value={p.id}>{p.plant_name}</option>)}
        </select>
        {isOwnProfile && (
          <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm" className="rounded-xl gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Ny anteckning
          </Button>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-primary/30 p-5 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-base">Ny journalpost</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.user_plant_id} onChange={e => setForm(f => ({...f, user_plant_id: e.target.value}))}
              className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Välj växt *</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.plant_name}</option>)}
            </select>
            <select value={form.entry_type} onChange={e => setForm(f => ({...f, entry_type: e.target.value}))}
              className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
              {Object.entries(ENTRY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Input placeholder="Rubrik" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="rounded-xl" />
          <textarea rows={3} placeholder="Innehåll..." value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))}
            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          {form.entry_type === "growth" && (
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Höjd (cm)" value={form.height_cm} onChange={e => setForm(f => ({...f, height_cm: e.target.value}))} className="rounded-xl" />
              <Input type="number" placeholder="Antal blad" value={form.leaf_count} onChange={e => setForm(f => ({...f, leaf_count: e.target.value}))} className="rounded-xl" />
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
              <Camera className="w-3.5 h-3.5" /> {uploading ? "Laddar..." : "Foto"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
            {form.photo_url && <img src={form.photo_url} alt="" className="w-10 h-10 object-cover rounded-lg" />}
            <Button onClick={handleSave} disabled={!form.user_plant_id} size="sm" className="ml-auto rounded-xl">Spara</Button>
          </div>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm">Inga journalanteckningar ännu.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />
          <div className="space-y-4 pl-14">
            {filtered.map((entry, i) => {
              const Icon = ENTRY_ICONS[entry.entry_type] || BookOpen;
              const colorClass = ENTRY_COLORS[entry.entry_type] || ENTRY_COLORS.note;
              const plant = plants.find(p => p.id === entry.user_plant_id);
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="relative bg-card rounded-2xl border border-border/60 p-4">
                  <div className={`absolute -left-[38px] top-4 w-7 h-7 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${colorClass} border-0 mb-1`}>
                        {ENTRY_LABELS[entry.entry_type]}
                      </span>
                      {entry.title && <p className="font-medium text-sm text-foreground">{entry.title}</p>}
                      {plant && <p className="text-xs text-primary">🌿 {plant.plant_name}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {entry.entry_date ? format(new Date(entry.entry_date), "d MMM yyyy", { locale: sv }) : ""}
                    </span>
                  </div>
                  {entry.content && <p className="text-sm text-muted-foreground">{entry.content}</p>}
                  {(entry.height_cm || entry.leaf_count) && (
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {entry.height_cm && <span>📏 {entry.height_cm} cm</span>}
                      {entry.leaf_count && <span>🍃 {entry.leaf_count} blad</span>}
                    </div>
                  )}
                  {entry.photo_url && (
                    <img src={entry.photo_url} alt="Journal foto" className="mt-3 w-full max-h-48 object-cover rounded-xl" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}