import { Shield, CheckCircle, Star, User, ShoppingBag } from "lucide-react";

const factors = (profile) => [
  { label: "Profil ifylld", done: !!(profile.bio && profile.avatar_url && profile.city), points: 20 },
  { label: "Verifierad", done: !!profile.is_verified, points: 30 },
  { label: "Webbplats länkad", done: !!profile.website, points: 10 },
  { label: "Social länk", done: !!(profile.instagram || profile.facebook), points: 10 },
  { label: "Företagsinfo", done: !!(profile.business_name && profile.org_number), points: 20 },
  { label: "Plats angiven", done: !!(profile.country && profile.city), points: 10 },
];

export default function ProfileTrustScore({ profile }) {
  const items = factors(profile);
  const score = items.reduce((s, f) => s + (f.done ? f.points : 0), 0);

  if (score === 0) return null;

  const color = score >= 80 ? "text-primary" : score >= 50 ? "text-amber-500" : "text-muted-foreground";
  const bg = score >= 80 ? "bg-primary/10" : score >= 50 ? "bg-amber-500/10" : "bg-muted";

  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-foreground">Förtroendepoäng</span>
        </div>
        <span className={`font-display text-2xl ${color}`}>{score}<span className="text-sm text-muted-foreground">/100</span></span>
      </div>
      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mb-3">
        <div className={`h-full rounded-full transition-all duration-700 ${score >= 80 ? "bg-primary" : score >= 50 ? "bg-amber-500" : "bg-muted-foreground"}`}
          style={{ width: `${score}%` }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {items.map((f) => (
          <div key={f.label} className={`flex items-center gap-1.5 text-[10px] ${f.done ? "text-foreground" : "text-muted-foreground/50"}`}>
            <CheckCircle className={`w-3 h-3 shrink-0 ${f.done ? "text-primary" : "text-muted-foreground/30"}`} />
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
}