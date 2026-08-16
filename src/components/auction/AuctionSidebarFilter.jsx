import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const PLANT_TYPES = [
  { id: "all", label: "All Plants", emoji: "🌿" },
  { id: "indoor", label: "Indoor", emoji: "🏠" },
  { id: "outdoor", label: "Outdoor", emoji: "🌳" },
  { id: "exotic", label: "Exotic", emoji: "🌴" },
  { id: "rare", label: "Rare", emoji: "💎" },
];

const POT_SIZES = [
  { value: "all", label: "All Sizes" },
  { value: "small", label: "Small (< 12cm)" },
  { value: "medium", label: "Medium (12-20cm)" },
  { value: "large", label: "Large (20-30cm)" },
  { value: "xl", label: "Extra Large (30cm+)" },
];

const SPECIES_LIST = [
  "Monstera", "Pothos", "Snake Plant", "Fiddle Leaf", "Orchid", 
  "Succulent", "Cactus", "Fern", "Palm", "Rose", "Tropical", "Other"
];

export default function AuctionSidebarFilter({ filters, onChange, onClose }) {
  const [expandedSection, setExpandedSection] = useState("type");

  const handleSetFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = [
    filters.plantType && filters.plantType !== "all",
    filters.potSize && filters.potSize !== "all",
    filters.maxPrice && filters.maxPrice < 10000,
    filters.species && filters.species !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    onChange({
      plantType: "all",
      potSize: "all",
      maxPrice: 10000,
      species: "all",
    });
  };

  return (
    <div className="bg-card border-l border-border/60 p-5 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-base text-foreground">Filters</h3>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reset button */}
      {activeCount > 0 && (
        <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-full justify-center py-1.5 rounded-lg hover:bg-muted/50">
          <X className="w-3 h-3" /> Clear All Filters
        </button>
      )}

      {/* Plant Type */}
      <div className="border-t border-border/40 pt-4">
        <button
          onClick={() => setExpandedSection(expandedSection === "type" ? null : "type")}
          className="flex items-center justify-between w-full mb-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span>Plant Type</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSection === "type" ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expandedSection === "type" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
              {PLANT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSetFilter("plantType", type.id)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    (filters.plantType || "all") === type.id
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Species */}
      <div className="border-t border-border/40 pt-4">
        <button
          onClick={() => setExpandedSection(expandedSection === "species" ? null : "species")}
          className="flex items-center justify-between w-full mb-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span>Species</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSection === "species" ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expandedSection === "species" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 max-h-56">
              <button
                onClick={() => handleSetFilter("species", "all")}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  (filters.species || "all") === "all"
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                All Species
              </button>
              {SPECIES_LIST.map((species) => (
                <button
                  key={species}
                  onClick={() => handleSetFilter("species", species)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    (filters.species || "all") === species
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {species}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pot Size */}
      <div className="border-t border-border/40 pt-4">
        <button
          onClick={() => setExpandedSection(expandedSection === "pot" ? null : "pot")}
          className="flex items-center justify-between w-full mb-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span>Pot Size</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSection === "pot" ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expandedSection === "pot" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
              {POT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleSetFilter("potSize", size.value)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    (filters.potSize || "all") === size.value
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Price Range */}
      <div className="border-t border-border/40 pt-4">
        <button
          onClick={() => setExpandedSection(expandedSection === "price" ? null : "price")}
          className="flex items-center justify-between w-full mb-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <span>Price Range</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSection === "price" ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expandedSection === "price" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 pb-2">
              <div className="text-xs text-muted-foreground">
                {filters.maxPrice >= 10000 ? "Any price" : `Up to ${filters.maxPrice} SEK`}
              </div>
              <Slider
                value={[filters.maxPrice || 10000]}
                onValueChange={([v]) => handleSetFilter("maxPrice", v)}
                min={0}
                max={10000}
                step={100}
                className="w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}