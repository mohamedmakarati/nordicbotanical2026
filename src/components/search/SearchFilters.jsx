import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const POT_SIZES = ["All Sizes", "Small (< 12cm)", "Medium (12-20cm)", "Large (20-30cm)", "Extra Large (30cm+)"];
const SIZE_LABELS = {
  "All Sizes": "Alla storlekar",
  "Small (< 12cm)": "Liten (< 12cm)",
  "Medium (12-20cm)": "Medel (12-20cm)",
  "Large (20-30cm)": "Stor (20-30cm)",
  "Extra Large (30cm+)": "Extra stor (30cm+)",
};
const SORT_OPTIONS = [
  { value: "lowest_price", label: "Lägsta pris" },
  { value: "highest_discount", label: "Högsta rabatt" },
  { value: "newest", label: "Nyast" },
];

const CATEGORIES = [
  { value: "all", label: "Alla", emoji: "🌿" },
  { value: "tropical", label: "Tropiska", emoji: "🌴" },
  { value: "succulent", label: "Suckulenter", emoji: "🌵" },
  { value: "cactus", label: "Kaktusar", emoji: "🌵" },
  { value: "orchid", label: "Orkidéer", emoji: "🌸" },
  { value: "fern", label: "Ormbunkar", emoji: "🌿" },
  { value: "palm", label: "Palmer", emoji: "🌴" },
  { value: "herb", label: "Kryddväxter", emoji: "🌱" },
  { value: "tree", label: "Träd", emoji: "🌳" },
  { value: "climbing", label: "Klätterväxter", emoji: "🍃" },
  { value: "other", label: "Övrigt", emoji: "🪴" },
];

export default function SearchFilters({ filters, onFiltersChange }) {
  const [showFilters, setShowFilters] = useState(false);

  const activeCount = [
    filters.potSize !== "All Sizes",
    filters.maxPrice < 5000,
  ].filter(Boolean).length;

  const resetFilters = () => {
    onFiltersChange({ ...filters, potSize: "All Sizes", maxPrice: 5000, category: "all" });
  };

  const selectedCategory = filters.category || "all";

  return (
    <div className="mb-6 space-y-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onFiltersChange({ ...filters, category: cat.value })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sortera:</span>
          <Select value={filters.sortBy} onValueChange={(v) => onFiltersChange({ ...filters, sortBy: v })}>
            <SelectTrigger className="rounded-xl text-sm h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-xl gap-2 text-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs bg-primary text-primary-foreground">
              {activeCount}
            </Badge>
          )}
        </Button>
        {(activeCount > 0 || selectedCategory !== "all") && (
          <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Rensa alla
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-2xl border border-border/60">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Krukstorlek</label>
                <Select value={filters.potSize} onValueChange={(v) => onFiltersChange({ ...filters, potSize: v })}>
                  <SelectTrigger className="rounded-xl text-sm h-9">
                    <SelectValue>{SIZE_LABELS[filters.potSize] || filters.potSize}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {POT_SIZES.map((s) => <SelectItem key={s} value={s}>{SIZE_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Maxpris: {filters.maxPrice >= 5000 ? "Valfritt" : `${filters.maxPrice} kr`}
                </label>
                <div className="pt-2 px-1">
                  <Slider
                    value={[filters.maxPrice]}
                    onValueChange={([v]) => onFiltersChange({ ...filters, maxPrice: v })}
                    min={0}
                    max={5000}
                    step={50}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}