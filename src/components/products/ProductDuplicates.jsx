import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Trash2, Merge, Loader2, RefreshCw, CheckCircle } from "lucide-react";

function similarity(a, b) {
  if (!a || !b) return 0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  // Simple word overlap
  const w1 = new Set(s1.split(/\s+/));
  const w2 = new Set(s2.split(/\s+/));
  const intersection = [...w1].filter(w => w2.has(w)).length;
  return intersection / Math.max(w1.size, w2.size);
}

export default function ProductDuplicates() {
  const [products, setProducts] = useState([]);
  const [sellersMap, setSellersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [threshold, setThreshold] = useState("0.7");
  const [resolving, setResolving] = useState(new Set());
  const [resolved, setResolved] = useState(new Set());

  useEffect(() => {
    Promise.all([base44.entities.Product.list("-created_date", 500), base44.entities.Seller.list()])
      .then(([prods, sels]) => {
        setProducts(prods);
        setSellersMap(Object.fromEntries(sels.map(s => [s.id, s.seller_name])));
        setLoading(false);
        detectDuplicates(prods, parseFloat(threshold));
      });
  }, []);

  const detectDuplicates = (prods, thresh) => {
    const dupGroups = [];
    const visited = new Set();

    for (let i = 0; i < prods.length; i++) {
      if (visited.has(prods[i].id)) continue;
      const group = [prods[i]];
      for (let j = i + 1; j < prods.length; j++) {
        if (visited.has(prods[j].id)) continue;
        const sim = similarity(prods[i].product_title, prods[j].product_title);
        if (sim >= thresh) {
          group.push(prods[j]);
          visited.add(prods[j].id);
        }
      }
      if (group.length > 1) {
        visited.add(prods[i].id);
        dupGroups.push(group);
      }
    }
    setGroups(dupGroups);
  };

  const reDetect = () => detectDuplicates(products, parseFloat(threshold));

  const deleteProduct = async (id, groupIdx) => {
    setResolving(prev => new Set([...prev, id]));
    await base44.entities.Product.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setGroups(prev => {
      const updated = [...prev];
      updated[groupIdx] = updated[groupIdx].filter(p => p.id !== id);
      return updated.filter(g => g.length > 1);
    });
    setResolving(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const keepOne = async (keepId, groupIdx) => {
    const group = groups[groupIdx];
    const toDelete = group.filter(p => p.id !== keepId);
    for (const p of toDelete) await deleteProduct(p.id, groupIdx);
    setResolved(prev => new Set([...prev, groupIdx]));
  };

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Copy className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Dubblettdetektering</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Likhetsgräns:</span>
          <Select value={threshold} onValueChange={v => setThreshold(v)}>
            <SelectTrigger className="w-28 rounded-xl text-sm h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">50%</SelectItem>
              <SelectItem value="0.6">60%</SelectItem>
              <SelectItem value="0.7">70%</SelectItem>
              <SelectItem value="0.8">80%</SelectItem>
              <SelectItem value="0.9">90%</SelectItem>
              <SelectItem value="1.0">100% (exakt)</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={reDetect} className="rounded-xl gap-1 h-8">
            <RefreshCw className="w-3.5 h-3.5" /> Sök igen
          </Button>
        </div>
        <Badge variant="outline" className="ml-auto">{groups.length} grupper hittade</Badge>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium text-foreground">Inga dubbletter hittades!</p>
          <p className="text-sm mt-1">Alla produkter verkar vara unika vid denna likhetsgräns.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="bg-card border border-orange-200 rounded-xl overflow-hidden">
              <div className="bg-orange-50 px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">{group.length} möjliga dubbletter</span>
                <Button size="sm" variant="ghost" className="text-xs text-orange-700 h-7 gap-1"
                  onClick={() => keepOne(group[0].id, gIdx)}>
                  <CheckCircle className="w-3.5 h-3.5" /> Behåll första, ta bort resten
                </Button>
              </div>
              <div className="divide-y divide-border/40">
                {group.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border/40" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.product_title}</div>
                      <div className="text-xs text-muted-foreground">{sellersMap[p.seller_id] || "—"} · {p.price?.toFixed(0)} kr</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary"
                        onClick={() => keepOne(p.id, gIdx)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Behåll denna
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => deleteProduct(p.id, gIdx)} disabled={resolving.has(p.id)}>
                        {resolving.has(p.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}