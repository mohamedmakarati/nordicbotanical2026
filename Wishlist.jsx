import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Heart, Trash2, ExternalLink, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u) {
        const data = await base44.entities.Wishlist.filter({ created_by_id: u.id });
        setItems(data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleRemove = async (id) => {
    await base44.entities.Wishlist.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Min önskelista</h1>
            <p className="text-sm text-muted-foreground">{items.length} sparade produkter</p>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Logga in för att se din önskelista.</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-xl">Logga in</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Din önskelista är tom. Lägg till växter från sökresultaten.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border/60 overflow-hidden group"
              >
                <div className="aspect-[4/3] bg-muted/50 overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-display text-base text-foreground leading-snug">{item.product_title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.seller_name}</span>
                    <span className="font-display text-lg text-primary">{item.price?.toFixed(0)} {item.currency || "SEK"}</span>
                  </div>
                  {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1 rounded-xl text-sm h-9 gap-1.5">
                      <a href={item.product_url} target="_blank" rel="noopener noreferrer">
                        Besök <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleRemove(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}