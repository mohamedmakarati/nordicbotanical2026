import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Send, X, Sparkles, ChevronDown, ExternalLink, Package, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const QUICK_SUGGESTIONS = [
  { label: "🫒 Cheapest olive tree", query: "Find me the cheapest olive tree" },
  { label: "💜 Lavender under 150 SEK", query: "Find lavender under 150 SEK" },
  { label: "🌿 Compare Monstera", query: "Compare all Monstera plants" },
  { label: "🏆 Best deal today", query: "Show me the best deal today" },
  { label: "🏠 Indoor plants under 200 SEK", query: "Find indoor plants under 200 SEK" },
];

const AVAILABILITY_LABELS = {
  in_stock: { label: "In stock", color: "text-green-600 bg-green-50" },
  limited: { label: "Limited", color: "text-amber-600 bg-amber-50" },
  out_of_stock: { label: "Out of stock", color: "text-red-500 bg-red-50" },
  pre_order: { label: "Pre-order", color: "text-blue-600 bg-blue-50" },
};

function ProductCard({ product, isBest }) {
  const avail = AVAILABILITY_LABELS[product.availability] || AVAILABILITY_LABELS.in_stock;
  const discount = product.regular_price && product.regular_price > product.price
    ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
    : null;

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${isBest ? "border-primary/40 ring-1 ring-primary/20" : "border-border/60"}`}>
      {isBest && (
        <div className="bg-primary text-primary-foreground text-[10px] font-semibold tracking-wider uppercase px-3 py-1 text-center">
          🏆 Best Deal
        </div>
      )}
      <div className="flex gap-3 p-3">
        {product.image_url ? (
          <img src={product.image_url} alt={product.plant_name} className="w-16 h-16 object-cover rounded-lg shrink-0 bg-muted" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Leaf className="w-7 h-7 text-primary/50" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{product.plant_name}</p>
              {product.scientific_name && (
                <p className="text-xs text-muted-foreground italic truncate">{product.scientific_name}</p>
              )}
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${avail.color}`}>
              {avail.label}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-base font-bold text-foreground">
              {product.price} <span className="text-xs font-normal text-muted-foreground">{product.currency}</span>
            </span>
            {discount && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">-{discount}%</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {product.shipping_cost === 0 ? (
                <span className="text-green-600 font-medium">Free shipping</span>
              ) : (
                <span>+{product.shipping_cost} {product.currency}</span>
              )}
            </span>
            <span className="font-medium text-foreground">
              Total: {product.total_price} {product.currency}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate">{product.seller_name}</span>
            <div className="flex items-center gap-2">
              {product.last_checked && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {format(new Date(product.last_checked), "d MMM")}
                </span>
              )}
              <a
                href={product.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                Visit shop <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%] text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Leaf className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 space-y-2">
        {message.text && (
          <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-foreground">
            {message.text}
          </div>
        )}
        {message.results && message.results.length > 0 && (
          <div className="space-y-2">
            {message.results.map((product, i) => (
              <ProductCard key={product.id} product={product} isBest={i === 0} />
            ))}
            {message.total_found > message.results.length && (
              <p className="text-xs text-muted-foreground text-center">
                Showing {message.results.length} of {message.total_found} results
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlantAssistant({ defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "🌿 Hi! I'm your Nordic Botanical assistant. Ask me to find plants, compare prices, or discover the best deals across Scandinavian stores!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const parseQueryToParams = (query) => {
    const q = query.toLowerCase();
    const params = { query };

    // Extract max price
    const priceMatch = q.match(/under\s+(\d+)/i) || q.match(/less than\s+(\d+)/i) || q.match(/billigare än\s+(\d+)/i) || q.match(/under\s+(\d+)\s*(sek|nok|dkk|eur)?/i);
    if (priceMatch) params.max_price = parseInt(priceMatch[1]);

    // Free shipping
    if (q.includes("free shipping") || q.includes("gratis frakt") || q.includes("fri frakt")) {
      params.free_shipping = true;
    }

    // Availability
    if (q.includes("in stock") || q.includes("i lager")) params.availability = "in_stock";

    // Category hints
    if (q.includes("indoor") || q.includes("krukväxt") || q.includes("inomhus")) params.category = "tropical";
    if (q.includes("succulent")) params.category = "succulent";
    if (q.includes("cactus") || q.includes("kaktus")) params.category = "cactus";
    if (q.includes("orchid") || q.includes("orkidé")) params.category = "orchid";
    if (q.includes("herb") || q.includes("ört")) params.category = "herb";

    return params;
  };

  const sendMessage = async (query) => {
    if (!query.trim() || loading) return;
    const userMsg = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const params = parseQueryToParams(query);

    const response = await base44.functions.invoke("searchPlants", params);
    const data = response.data;

    let text = "";
    if (!data.results || data.results.length === 0) {
      text = `I couldn't find any plants matching "${query}". Try a different search term or browse by category! 🌱`;
    } else {
      text = `Found ${data.total_found} result${data.total_found !== 1 ? "s" : ""} — sorted by total price (including shipping). Here are the best deals: 🌿`;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text,
        results: data.results || [],
        total_found: data.total_found || 0,
      },
    ]);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button (shown when closed and not defaultOpen) */}
      {!defaultOpen && !isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-xl font-medium text-sm"
        >
          <Sparkles className="w-4 h-4" />
          AI Plant Assistant
        </motion.button>
      )}

      {/* Chat window */}
      <AnimatePresence>
        {(isOpen || defaultOpen) && (
          <motion.div
            initial={{ opacity: 0, y: defaultOpen ? 0 : 20, scale: defaultOpen ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={
              defaultOpen
                ? "w-full"
                : "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]"
            }
          >
            <div className={`bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${defaultOpen ? "" : "h-[560px]"}`}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-primary/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Plant Assistant</p>
                    <p className="text-[10px] text-muted-foreground">Nordic Botanical AI</p>
                  </div>
                </div>
                {!defaultOpen && (
                  <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${defaultOpen ? "max-h-[400px]" : ""}`}>
                {messages.map((msg, i) => (
                  <AssistantMessage key={i} message={msg} />
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Leaf className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Quick searches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s.query}
                        onClick={() => sendMessage(s.query)}
                        className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-border/40">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Find me the cheapest lavender..."
                    className="flex-1 text-sm bg-muted/40 border border-border/40 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
                    disabled={loading}
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || loading} className="rounded-xl h-9 w-9 shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}