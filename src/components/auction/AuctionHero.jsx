import { Gavel, TrendingDown, Clock, Shield } from "lucide-react";

export default function AuctionHero() {
  return (
    <div className="bg-gradient-to-br from-primary/8 via-accent/20 to-background border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Gavel className="w-3.5 h-3.5" /> Nordisk växtauktion
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Köp & sälj sällsynta växter
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Norden ledande marknadsplats för växtauktioner. Privata säljare, plantskolor och grossister.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { label: "Verifierade säljare" },
              { label: "Alltid bästa pris" },
              { label: "Tidsauktioner" },
            ].map(({ label }) => (
              <div key={label} className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}