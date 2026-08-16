import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Leaf, X, Star, Sparkles, BookOpen } from "lucide-react";
import ImageUploader from "@/components/ui/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PlantDetailModal from "./PlantDetailModal";

const AVAILABILITY_COLORS = {
  display_only: "bg-secondary text-secondary-foreground",
  for_sale: "bg-primary/10 text-primary",
  for_trade: "bg-blue-500/10 text-blue-600",
  sold: "bg-muted text-muted-foreground",
};
const AVAILABILITY_LABELS = { display_only: "Visas", for_sale: "Till salu", for_trade: "Byte", sold: "Såld" };

export default function CollectorGallery({ plants, isOwnProfile, onUpdate, userId }) {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ plant_name: "", scientific_name: "", category: "houseplant", is_rare: false, rarity_score: 0, estimated_value: "", availability: "display_only", care_notes: "", favorite_species: false });

  const [filter, setFilter] = useState("all");

  const FILTERS = [
    { id: "all", label: "Alla" },
    { id: "rare", label: "Sällsynta" },
    { id: "for_sale", label: "Till salu" },
    { id: "favorite", label: "Favoriter" },
  ];

  const filtered = plants.filter(p => {
    if (filter === "rare") return p.is_rare;
    if (filter === "for_sale") return p.availability === "for_sale";
    if (filter === "favorite") return p.favorite_species;
    return true;
  });



  const handleSave = async () => {
    const data = { ...form, user_id: userId, estimated_value: Number(form.estimated_value) || 0 };
    const created = await base44.entities.UserPlant.create(data);
    onUpdate(prev => [...prev, created]);
    setShowAddForm(false);
    setForm({ plant_name: "", scientific_name: "", category: "houseplant", is_rare: false, rarity_score: 0, estimated_value: "", availability: "display_only", care_notes: "", favorite_species: false });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}>
              {f.label}
            </button>
          ))}
        </div>
        {isOwnProfile && (
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm" className="rounded-xl gap-2 text-xs shrink-0">
            <Plus className="w-3.5 h-3.5" /> Lägg till växt
          </Button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-2xl border border-primary/30 p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-base">Ny växt i samlingen</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Växtnamn *" value={form.plant_name} onChange={e => setForm(f => ({...f, plant_name: e.target.value}))} className="rounded-xl" />
              <Input placeholder="Vetenskapligt namn" value={form.scientific_name || ""} onChange={e => setForm(f => ({...f, scientific_name: e.target.value}))} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
                {["houseplant","rare","orchid","bonsai","succulent","tree","garden"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.availability} onChange={e => setForm(f => ({...f, availability: e.target.value}))} className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
                {Object.entries(AVAILABILITY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Input type="number" placeholder="Värde (kr)" value={form.estimated_value} onChange={e => setForm(f => ({...f, estimated_value: e.target.value}))} className="rounded-xl" />
              <Input type="number" min={0} max={10} placeholder="Sällsynthet 0-10" value={form.rarity_score} onChange={e => setForm(f => ({...f, rarity_score: Number(e.target.value)}))} className="rounded-xl" />
            </div>
            <textarea rows={2} placeholder="Skötselanteckningar..." value={form.care_notes || ""} onChange={e => setForm(f => ({...f, care_notes: e.target.value}))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.is_rare} onChange={e => setForm(f => ({...f, is_rare: e.target.checked}))} className="rounded" />
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sällsynt
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.favorite_species} onChange={e => setForm(f => ({...f, favorite_species: e.target.checked}))} className="rounded" />
                <Star className="w-3.5 h-3.5 text-red-400" /> Favoritart
              </label>
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-muted-foreground mb-1">Foton</p>
                <ImageUploader
                  multiple
                  value={form.photos ? [form.image_url, ...form.photos].filter(Boolean) : (form.image_url ? [form.image_url] : [])}
                  onChange={(urls) => setForm(f => ({ ...f, image_url: urls[0] || "", photos: urls.slice(1) }))}
                  maxImages={5}
                  placeholder="Lägg till foton"
                />
              </div>
              <Button onClick={handleSave} disabled={!form.plant_name} size="sm" className="ml-auto rounded-xl">Spara</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Leaf className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm">Inga växter i den här vyn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((plant, i) => (
            <motion.div key={plant.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedPlant(plant)}
              className="bg-card rounded-2xl border border-border/60 overflow-hidden group cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
              <div className="aspect-square bg-muted/50 overflow-hidden relative">
                {plant.image_url ? (
                  <img src={plant.image_url} alt={plant.plant_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Leaf className="w-8 h-8 text-muted-foreground/20" /></div>
                )}
                {plant.is_rare && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                {plant.favorite_species && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-foreground leading-tight truncate">{plant.plant_name}</p>
                {plant.scientific_name && <p className="text-[10px] text-muted-foreground italic truncate">{plant.scientific_name}</p>}
                <div className="flex items-center justify-between mt-2">
                  <Badge className={`${AVAILABILITY_COLORS[plant.availability] || ""} border-0 text-[9px] px-1.5 py-0 rounded-md`}>
                    {AVAILABILITY_LABELS[plant.availability]}
                  </Badge>
                  {plant.estimated_value > 0 && <span className="text-[10px] text-primary font-medium">{plant.estimated_value} kr</span>}
                </div>
                {plant.care_notes && (
                  <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground">
                    <BookOpen className="w-2.5 h-2.5" /> Anteckning
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedPlant && (
        <PlantDetailModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} isOwnProfile={isOwnProfile}
          onUpdate={(updated) => { onUpdate(prev => prev.map(p => p.id === updated.id ? updated : p)); setSelectedPlant(updated); }}
          onDelete={(id) => { onUpdate(prev => prev.filter(p => p.id !== id)); setSelectedPlant(null); }} />
      )}
    </div>
  );
}