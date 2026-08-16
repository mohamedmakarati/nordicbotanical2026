import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["all", "tropical", "succulent", "cactus", "fern", "orchid", "palm", "herb", "tree", "climbing", "rose", "other"];
const TYPES = ["all", "standard", "buy_now", "reserve", "bulk", "dutch", "timed"];
const COUNTRIES = ["all", "Sweden", "Norway", "Denmark", "Finland", "Other"];

const TYPE_LABELS = { all: "All Types", standard: "Auction", buy_now: "Buy Now", reserve: "Reserve", bulk: "Bulk", dutch: "Dutch", timed: "Timed" };
const CAT_LABELS = { all: "All Categories", tropical: "Tropical", succulent: "Succulent", cactus: "Cactus", fern: "Fern", orchid: "Orchid", palm: "Palm", herb: "Herb", tree: "Tree", climbing: "Climbing", rose: "Rose", other: "Other" };

export default function AuctionFilters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 pb-3">
      <Select value={filters.category} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="w-44 h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CAT_LABELS[c] || c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.type} onValueChange={(v) => set("type", v)}>
        <SelectTrigger className="w-36 h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t] || t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.country} onValueChange={(v) => set("country", v)}>
        <SelectTrigger className="w-36 h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All Countries" : c}</SelectItem>)}
        </SelectContent>
      </Select>
      {(filters.category !== "all" || filters.type !== "all" || filters.country !== "all") && (
        <Button variant="ghost" size="sm" className="h-8 text-xs rounded-xl text-muted-foreground"
          onClick={() => onChange({ category: "all", type: "all", country: "all" })}>
          Clear filters
        </Button>
      )}
    </div>
  );
}