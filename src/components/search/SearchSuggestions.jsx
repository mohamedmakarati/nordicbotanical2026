import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SearchSuggestions({ query, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const cacheRef = useRef(null);
  const wrapRef = useRef(null);

  // Load all products once (cached), then filter locally
  useEffect(() => {
    if (cacheRef.current) return;
    setLoading(true);
    base44.entities.Product.list("-last_checked", 200)
      .then((products) => {
        const mapped = products
          .filter((p) => p.product_title)
          .map((p) => ({
            title: p.product_title,
            image_url: p.image_url,
            price: p.price,
            currency: p.currency || "SEK",
          }));
        // Deduplicate by title
        const seen = new Set();
        const deduped = mapped.filter((p) => {
          const key = p.title.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        cacheRef.current = deduped;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Normalize common typo substitutions (3→e, 0→o, 1→i, 5→s, 7→t, 4→a, @→a, $→s)
  const normalize = (s) =>
    s.toLowerCase()
      .replace(/3/g, "e")
      .replace(/0/g, "o")
      .replace(/1/g, "i")
      .replace(/5/g, "s")
      .replace(/7/g, "t")
      .replace(/4/g, "a")
      .replace(/@/g, "a")
      .replace(/\$/g, "s");

  // Simple Levenshtein distance for fuzzy matching
  const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
    return dp[m][n];
  };

  // Check if query fuzzy-matches a word in the title (handles typos like "monst3r"→"monstera")
  const fuzzyWordMatch = (title, q) => {
    const normTitle = normalize(title);
    const normQ = normalize(q);
    if (normTitle.includes(normQ)) return true;
    const words = normTitle.split(/[\s\-_,.]+/).filter(Boolean);
    for (const w of words) {
      if (w.startsWith(normQ.slice(0, 3))) {
        const dist = levenshtein(normQ, w.slice(0, normQ.length + 2));
        if (dist <= 2) return true;
      }
      const dist = levenshtein(normQ, w);
      if (w.length >= 4 && dist <= 2) return true;
    }
    return false;
  };

  // Filter suggestions based on query
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    const q = query.trim().toLowerCase();
    const all = cacheRef.current || [];
    const matches = all
      .filter((p) => fuzzyWordMatch(p.title, q))
      .slice(0, 6);
    setSuggestions(matches);
    setShow(matches.length > 0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!show) return null;

  return (
    <div
      ref={wrapRef}
      className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-xl border border-border/60 overflow-hidden z-50"
    >
      {loading && (
        <div className="px-4 py-3 text-sm text-muted-foreground">Laddar förslag…</div>
      )}
      {!loading && suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            setShow(false);
            onSelect(s.title);
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/30 last:border-0"
        >
          {s.image_url ? (
            <img
              src={s.image_url}
              alt=""
              className="w-9 h-9 rounded-lg object-cover shrink-0 bg-muted"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />
          )}
          <span className="flex-1 text-sm text-foreground truncate">{s.title}</span>
          {s.price != null && (
            <span className="text-xs text-muted-foreground shrink-0">
              {s.price} {s.currency}
            </span>
          )}
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}