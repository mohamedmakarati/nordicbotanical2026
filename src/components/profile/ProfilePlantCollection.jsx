import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Leaf, Pencil, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "all", label: "Alla" },
  { value: "houseplant", label: "Krukväxter" },
  { value: "rare", label: "Sällsynta" },
  { value: "orchid", label: "Orkidéer" },
  { value: "bonsai", label: "Bonsai" },
  { value: "succulent", label: "Suckulenter" },
  { value: "tree", label: "Träd" },
  { value: "garden", label: "Trädgård" },
];

const AVAILABILITY_LABELS = {
  display_only: { label: "Visas", color: "bg-secondary text-secondary-foreground" },
  for_sale: { label: "Till salu", color: "bg-primary/10 text-primary" },
  for_trade: { label: "Byte", color: "bg-blue-500/10 text-blue-600" },
  sold: { label: "Såld", color: "bg-muted text-muted-foreground" },
};

const EMPTY_FORM = { plant_name: "", scientific_name: "", description: "", category: "houseplant", quantity: 1, availability: "display_only", price: "" };

export default function ProfilePlantCollection({ userId, isOwnProfile }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    base44.entities.UserPlant.filter({ user_id: userId })
      .then(setPlants)
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = activeCategory === "all" ? plants : plants.filter((p) => p.category === activeCategory);

  const handleEdit = (plant) => { setEditingPlant(plant); setForm(plant); setShowForm(true); };
  const handleNew = () => { setEditingPlant(null); setForm(EMPTY_FORM); setShowForm(true); };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingImg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url }));
    setUploadingImg(false);
  };

  const handleSave = async () => {
    const data = { ...form, user_id: userId };
    if (editingPlant) {
      const updated = await base44.entities.UserPlant.update(editingPlant.id, data);
      setPlants((prev) => prev.map((p) => p.id === editingPlant.id ? updated : p));
    } else {
      const created = await base44.entities.UserPlant.create(data);
      setPlants((prev) => [...prev, created]);
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.UserPlant.delete(id);
    setPlants((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setActiveCategory(c.value)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeCategory === c.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/40"
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {isOwnProfile && (
        <div className="mb-5">
          <Button onClick={handleNew} variant="outline" className="rounded-xl gap-2 text-sm">
            <Plus className="w-4 h-4" /> Lägg till växt
          </Button>
        </div>
      )}

      {/* Add/edit form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-primary/30 p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base">{editingPlant ? "Redigera växt" : "Ny växt"}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Växtnamn *" value={form.plant_name || ""} onChange={(e) => setForm((f) => ({ ...f, plant_name: e.target.value }))} className="rounded-xl" />
            <Input placeholder="Vetenskapligt namn" value={form.scientific_name || ""} onChange={(e) => setForm((f) => ({ ...f, scientific_name: e.target.value }))} className="rounded-xl" />
          </div>
          <textarea rows={2} placeholder="Beskrivning" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
              className="px-3 py-2 text-sm rounded-xl border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
              {Object.entries(AVAILABILITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l.label}</option>)}
            </select>
            <Input type="number" placeholder="Antal" value={form.quantity || ""} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} className="rounded-xl" />
            <Input type="number" placeholder="Pris (SEK)" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="rounded-xl" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
              <Plus className="w-3.5 h-3.5" /> {uploadingImg ? "Laddar upp..." : "Bild"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
            {form.image_url && <img src={form.image_url} alt="" className="w-10 h-10 object-cover rounded-lg" />}
            <Button onClick={handleSave} className="ml-auto rounded-xl gap-2 text-sm"><Save className="w-3.5 h-3.5" />Spara</Button>
          </div>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Leaf className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          Ingen samling att visa ännu.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((plant, i) => (
            <motion.div key={plant.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border/60 overflow-hidden group">
              <div className="aspect-square bg-muted/50 overflow-hidden">
                {plant.image_url ? (
                  <img src={plant.image_url} alt={plant.plant_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Leaf className="w-8 h-8 text-muted-foreground/20" /></div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-sm text-foreground leading-tight">{plant.plant_name}</p>
                {plant.scientific_name && <p className="text-[10px] text-muted-foreground italic">{plant.scientific_name}</p>}
                <div className="flex items-center justify-between mt-2">
                  <Badge className={`${AVAILABILITY_LABELS[plant.availability]?.color || ""} border-0 text-[9px] px-1.5 py-0 rounded-md`}>
                    {AVAILABILITY_LABELS[plant.availability]?.label}
                  </Badge>
                  {plant.price > 0 && <span className="text-xs text-primary font-medium">{plant.price} kr</span>}
                </div>
                {isOwnProfile && (
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(plant)} className="flex-1 text-[10px] text-muted-foreground hover:text-primary flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-muted/50">
                      <Pencil className="w-3 h-3" /> Redigera
                    </button>
                    <button onClick={() => handleDelete(plant.id)} className="flex-1 text-[10px] text-muted-foreground hover:text-destructive flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-destructive/5">
                      <Trash2 className="w-3 h-3" /> Ta bort
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}