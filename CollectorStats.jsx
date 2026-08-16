import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Leaf, Sparkles, Star, TrendingUp, DollarSign } from "lucide-react";

const COLORS = ["#2d6a4f", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7", "#d8f3dc"];
const CATEGORY_LABELS = { houseplant: "Krukväxter", rare: "Sällsynta", orchid: "Orkidéer", bonsai: "Bonsai", succulent: "Suckulenter", tree: "Träd", garden: "Trädgård" };
const AVAIL_LABELS = { display_only: "Visas", for_sale: "Till salu", for_trade: "Byte", sold: "Såld" };

export default function CollectorStats({ plants }) {
  if (plants.length === 0) return (
    <div className="text-center py-16 text-muted-foreground">
      <Leaf className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm">Inga växter att visa statistik för.</p>
    </div>
  );

  const byCat = Object.entries(
    plants.reduce((acc, p) => { acc[p.category || "houseplant"] = (acc[p.category || "houseplant"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value }));

  const byAvail = Object.entries(
    plants.reduce((acc, p) => { acc[p.availability || "display_only"] = (acc[p.availability || "display_only"] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: AVAIL_LABELS[name] || name, value }));

  const topByValue = [...plants].filter(p => p.estimated_value > 0).sort((a, b) => b.estimated_value - a.estimated_value).slice(0, 8);
  const totalValue = plants.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const avgRarity = plants.filter(p => p.rarity_score > 0).reduce((s, p, _, a) => s + p.rarity_score / a.length, 0);
  const uniqueSpecies = new Set(plants.map(p => p.scientific_name || p.plant_name)).size;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Totalt antal", value: plants.length, icon: Leaf, color: "text-primary" },
          { label: "Unika arter", value: uniqueSpecies, icon: Sparkles, color: "text-blue-500" },
          { label: "Sällsynta", value: plants.filter(p => p.is_rare).length, icon: Star, color: "text-amber-500" },
          { label: "Genomsnittlig sällsynthet", value: avgRarity ? avgRarity.toFixed(1) : "—", icon: TrendingUp, color: "text-purple-500" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border/60 p-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1.5`} />
            <div className="font-display text-2xl text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category pie */}
        <div className="bg-card rounded-2xl border border-border/60 p-5">
          <h3 className="font-display text-base mb-4">Fördelning per kategori</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Availability bar */}
        <div className="bg-card rounded-2xl border border-border/60 p-5">
          <h3 className="font-display text-base mb-4">Tillgänglighet</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byAvail} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top value plants */}
      {topByValue.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 p-5">
          <h3 className="font-display text-base mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Mest värdefulla växter</h3>
          <div className="space-y-2">
            {topByValue.map((plant, i) => (
              <div key={plant.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                {plant.image_url ? (
                  <img src={plant.image_url} alt={plant.plant_name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Leaf className="w-4 h-4 text-muted-foreground/50" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{plant.plant_name}</p>
                  {plant.scientific_name && <p className="text-[10px] text-muted-foreground italic truncate">{plant.scientific_name}</p>}
                </div>
                <div className="text-sm font-medium text-primary shrink-0">{plant.estimated_value?.toLocaleString("sv-SE")} kr</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Totalt samlingsvärde</span>
            <span className="font-display text-lg text-primary">{totalValue.toLocaleString("sv-SE")} kr</span>
          </div>
        </div>
      )}
    </div>
  );
}