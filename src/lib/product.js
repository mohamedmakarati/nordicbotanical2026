// Decode a plantagen.se Next.js image-optimizer URL into its direct CDN URL
// (media.crystallize.com), which allows hotlinking. Falls back to the original.
export function realImageUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.pathname.includes("/_next/image")) {
      const inner = u.searchParams.get("url");
      if (inner) return decodeURIComponent(inner);
    }
  } catch {
    // not a valid URL — return as-is
  }
  return url;
}

export function formatPrice(val) {
  if (val == null || val === "") return "";
  const n = Number(val);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 2 }) + " kr";
}