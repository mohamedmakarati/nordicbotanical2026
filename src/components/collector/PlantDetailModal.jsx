import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Star, Pencil, Trash2, ChevronLeft, ChevronRight, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const AVAILABILITY_LABELS = { display_only: "Visas", for_sale: "Till salu", for_trade: "Byte", sold: "Såld" };

export default function PlantDetailModal({ plant, onClose, isOwnProfile, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(plant);
  const [saving, setSaving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const allPhotos = [plant.image_url, ...(plant.photo_urls || [])].filter(Boolean);

  const handleSave = async () => {
    setSaving(true);
    const updated = await base44.entities.UserPlant.update(plant.id, form);
    onUpdate(updated);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Ta bort den här växten?")) return;
    await base44.entities.UserPlant.delete(plant.id);
    onDelete(plant.id);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newPhotos = [...(form.photo_urls || []), file_url];
    setForm(f => ({ ...f, photo_urls: newPhotos }));
    setUploadingPhoto(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Photo carousel */}
        <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden rounded-t-3xl">
          {allPhotos.length > 0 ? (
            <>
              <img src={allPhotos[photoIndex]} alt={plant.plant_name} className="w-full h-full object-cover" />
              {allPhotos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIndex(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPhotoIndex(i => (i + 1) % allPhotos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {allPhotos.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-6xl">🌿</div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!editing ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-foreground">{plant.plant_name}</h2>
                  {plant.scientific_name && <p className="text-sm text-muted-foreground italic">{plant.scientific_name}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {plant.is_rare && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs flex items-center gap-1"><Sparkles className="w-3 h-3" />Sällsynt</Badge>}
                  {plant.favorite_species && <Badge className="bg-red-500/10 text-red-500 border-0 text-xs flex items-center gap-1"><Star className="w-3 h-3" />Favorit</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Tillgänglighet", value: AVAILABILITY_LABELS[plant.availability] },
                  { label: "Sällsynthet", value: plant.rarity_score ? `${plant.rarity_score}/10` : "—" },
                  { label: "Värde", value: plant.estimated_value ? `${plant.estimated_value} kr` : "—" },
                ].map(s => (
                  <div key={s.label} className="bg-muted/40 rounded-xl p-2.5">
                    <div className="text-xs text-muted-foreground mb-0.5">{s.label}</div>
                    <div className="text-sm font-medium text-foreground">{s.value}</div>
                  </div>
                ))}
              </div>

              {plant.care_notes && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-primary" /> Skötselanteckningar
                  </div>
                  <p className="text-sm text-muted-foreground">{plant.care_notes}</p>
                </div>
              )}

              {plant.description && <p className="text-sm text-muted-foreground">{plant.description}</p>}

              {isOwnProfile && (
                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="rounded-xl gap-2 flex-1">
                    <Pencil className="w-3.5 h-3.5" /> Redigera
                  </Button>
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> {uploadingPhoto ? "Laddar..." : "Foto"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  <Button onClick={handleDelete} variant="ghost" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <h3 className="font-display text-lg">Redigera växt</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input value={form.plant_name} onChange={e => setForm(f => ({...f, plant_name: e.target.value}))} placeholder="Växtnamn" className="rounded-xl" />
                <Input value={form.scientific_name || ""} onChange={e => setForm(f => ({...f, scientific_name: e.target.value}))} placeholder="Vetenskapligt namn" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={form.rarity_score || 0} onChange={e => setForm(f => ({...f, rarity_score: Number(e.target.value)}))} placeholder="Sällsynthet 0-10" className="rounded-xl" />
                <Input type="number" value={form.estimated_value || ""} onChange={e => setForm(f => ({...f, estimated_value: Number(e.target.value)}))} placeholder="Värde (kr)" className="rounded-xl" />
              </div>
              <textarea rows={3} value={form.care_notes || ""} onChange={e => setForm(f => ({...f, care_notes: e.target.value}))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Skötselanteckningar..." />
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.is_rare} onChange={e => setForm(f => ({...f, is_rare: e.target.checked}))} />
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sällsynt
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.favorite_species} onChange={e => setForm(f => ({...f, favorite_species: e.target.checked}))} />
                  <Star className="w-3.5 h-3.5 text-red-400" /> Favorit
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl flex-1">{saving ? "Sparar..." : "Spara"}</Button>
                <Button onClick={() => setEditing(false)} variant="ghost" size="sm" className="rounded-xl">Avbryt</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}