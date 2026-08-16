import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Heart, X, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CollectorWishlist({ plants, isOwnProfile, onUpdate, userId }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plant_name: "", scientific_name: "", is_rare: false, rarity_score: 0 });

  const handleAdd = async () => {
    if (!form.plant_name) return;
    const created = await base44.entities.UserPlant.create({ ...form, user_id: userId, is_wishlist: true });
    onUpdate(prev => [...prev, created]);
    setShowForm(false);
    setForm({ plant_name: "", scientific_name: "", is_rare: false, rarity_score: 0 });
  };

  const handleRemove = async (id) => {
    await base44.entities.UserPlant.delete(id);
    onUpdate(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      {isOwnProfile && (
        <div className="mb-5">
          <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm" className="rounded-xl gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Lägg till i önskelistan
          </Button>
        </div>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-primary/30 p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <h3 className="font-display text-base">Ny önskväxt</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Växtnamn *" value={form.plant_name} onChange={e => setForm(f => ({...f, plant_name: e.target.value}))} className="rounded-xl" />
            <Input placeholder="Vetenskapligt namn" value={form.scientific_name || ""} onChange={e => setForm(f => ({...f, scientific_name: e.target.value}))} className="rounded-xl" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.is_rare} onChange={e => setForm(f => ({...f, is_rare: e.target.checked}))} />
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sällsynt
            </label>
            <Input type="number" min={0} max={10} placeholder="Sällsynthet 0-10" value={form.rarity_score} onChange={e => setForm(f => ({...f, rarity_score: Number(e.target.value)}))} className="rounded-xl w-36" />
            <Button onClick={handleAdd} disabled={!form.plant_name} size="sm" className="ml-auto rounded-xl">Lägg till</Button>
          </div>
        </motion.div>
      )}

      {plants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm">Önskelistan är tom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {plants.map((plant, i) => (
            <motion.div key={plant.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border/60 p-4 group relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                {plant.is_rare ? <Sparkles className="w-6 h-6 text-amber-500" /> : <Leaf className="w-6 h-6 text-primary" />}
              </div>
              <p className="font-medium text-sm text-foreground leading-tight">{plant.plant_name}</p>
              {plant.scientific_name && <p className="text-[10px] text-muted-foreground italic mt-0.5">{plant.scientific_name}</p>}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {plant.is_rare && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[9px] px-1.5">Sällsynt</Badge>}
                {plant.rarity_score > 0 && <Badge variant="outline" className="text-[9px] px-1.5">{plant.rarity_score}/10</Badge>}
              </div>
              {isOwnProfile && (
                <button onClick={() => handleRemove(plant.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-destructive/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20">
                  <X className="w-3 h-3 text-destructive" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}