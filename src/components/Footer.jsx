import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const LINKS = {
  "Köp & Sälj": [
    { label: "Sök växter", to: "/search" },
    { label: "Bästa deals", to: "/deals" },
    { label: "Auktioner", to: "/auctions" },
    { label: "Sälj din växt", to: "/auctions/sell" },
    { label: "Butikskatalog", to: "/sellers" },
  ],
  "Verktyg": [
    { label: "AI-identifiering", to: "/identify" },
    { label: "AI Prisjämförelse", to: "/price-comparison" },
    { label: "Växtdatabas", to: "/plants" },
    { label: "Min önskelista", to: "/wishlist" },
    { label: "Min dashboard", to: "/dashboard" },
  ],
  "Nordic Botanical": [
    { label: "Om oss", to: "/about" },
    { label: "Blogg & guider", to: "/blog" },
    { label: "Kontakt", to: "/contact" },
    { label: "Bli säljare", to: "/auctions/sell" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display text-sm text-foreground">Nordic Botanical</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              Nordens ledande plattform för växter — prisjämförelse, auktioner och AI-assistans.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Kontakt</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:info@nordicbotanical.com" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  info@nordicbotanical.com
                </a>
              </li>
              <li>
                <a href="tel:+46736999491" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  +46 736 99 94 91
                </a>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Stora Algatan 3, Lund, Sweden
              </li>
            </ul>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{heading}</h4>
              <ul className="space-y-2">
                {items.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 Nordic Botanical. All rights reserved. · Nordic Botanical is a Swedish platform for plant auctions, plant marketplaces, plant price comparison, and plant discovery.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors">Om oss</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Kontakt</Link>
            <Link to="/blog" className="hover:text-primary transition-colors">Blogg</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}