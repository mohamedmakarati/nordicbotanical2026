import { useEffect } from "react";

const SITE_NAME = "NordicBotanical.com";
const DEFAULT_IMAGE = "https://nordicbotanical.com/og-image.jpg";
const HREFLANG_URLS = [
  { lang: "sv-SE", prefix: "" },
  { lang: "no-NO", prefix: "/no" },
  { lang: "da-DK", prefix: "/da" },
  { lang: "fi-FI", prefix: "/fi" },
  { lang: "en",    prefix: "/en" },
  { lang: "ar",    prefix: "/ar" },
  { lang: "x-default", prefix: "" },
];

export default function SEOHead({ title, description, url, image, structuredData }) {
  useEffect(() => {
    // Title
    document.title = title || `${SITE_NAME} – Jämför växtpriser i Norden`;

    // Helper to set/create meta
    const setMeta = (selector, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const attr = selector.match(/\[([^\]=]+)=/)?.[1];
        const val  = selector.match(/="([^"]+)"/)?.[1];
        if (attr && val) el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLink = (rel, href, extra = {}) => {
      const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
      if (existing) return;
      const el = document.createElement("link");
      el.setAttribute("rel", rel);
      el.setAttribute("href", href);
      Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    };

    // Basic meta
    if (description) setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', "index, follow");

    // OG
    setMeta('meta[property="og:title"]', title || "");
    setMeta('meta[property="og:description"]', description || "");
    setMeta('meta[property="og:type"]', "website");
    setMeta('meta[property="og:url"]', url || "");
    setMeta('meta[property="og:image"]', image || DEFAULT_IMAGE);
    setMeta('meta[property="og:site_name"]', SITE_NAME);
    setMeta('meta[property="og:locale"]', "sv_SE");

    // Twitter
    setMeta('meta[name="twitter:card"]', "summary_large_image");
    setMeta('meta[name="twitter:title"]', title || "");
    setMeta('meta[name="twitter:description"]', description || "");
    setMeta('meta[name="twitter:image"]', image || DEFAULT_IMAGE);

    // Canonical
    if (url) setLink("canonical", url);

    // hreflang
    HREFLANG_URLS.forEach(({ lang, prefix }) => {
      const hrefBase = url || "https://nordicbotanical.com";
      const path = hrefBase.replace("https://nordicbotanical.com", "");
      setLink("alternate", `https://nordicbotanical.com${prefix}${path}`, { hreflang: lang });
    });

    // Structured data
    if (structuredData) {
      let sdEl = document.getElementById("__nb_structured_data");
      if (!sdEl) {
        sdEl = document.createElement("script");
        sdEl.id = "__nb_structured_data";
        sdEl.type = "application/ld+json";
        document.head.appendChild(sdEl);
      }
      sdEl.textContent = JSON.stringify(structuredData);
    }

    return () => {
      // Cleanup structured data on unmount
      const el = document.getElementById("__nb_structured_data");
      if (el) el.remove();
    };
  }, [title, description, url, image, structuredData]);

  return null;
}