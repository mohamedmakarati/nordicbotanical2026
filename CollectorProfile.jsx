import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Leaf, ChevronRight, CheckCircle, MapPin, Globe, Instagram,
  UserPlus, UserCheck, Sparkles, Heart, Star, TrendingUp, Copy, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CollectorStats from "@/components/collector/CollectorStats";
import CollectorGallery from "@/components/collector/CollectorGallery";
import CollectorWishlist from "@/components/collector/CollectorWishlist";
import PlantJournalTimeline from "@/components/collector/PlantJournalTimeline";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function CollectorProfile() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [plants, setPlants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gallery");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      base44.entities.UserProfile.filter({ username: slug }),
      base44.auth.me().catch(() => null),
    ]).then(async ([profiles, me]) => {
      const found = profiles[0];
      setCurrentUser(me);
      if (found) {
        setProfile(found);
        setFollowerCount(found.follower_count || 0);
        const allPlants = await base44.entities.UserPlant.filter({ user_id: found.user_id });
        setPlants(allPlants);
        if (me) {
          const follows = await base44.entities.Follow.filter({ follower_id: me.id, following_id: found.user_id });
          setIsFollowing(follows.length > 0);
        }
      }
      setLoading(false);
    });
  }, [slug]);

  const handleFollow = async () => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    if (isFollowing) {
      const follows = await base44.entities.Follow.filter({ follower_id: currentUser.id, following_id: profile.user_id });
      if (follows[0]) await base44.entities.Follow.delete(follows[0].id);
      await base44.entities.UserProfile.update(profile.id, { follower_count: Math.max(0, followerCount - 1) });
      setFollowerCount(c => Math.max(0, c - 1));
      setIsFollowing(false);
    } else {
      await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: profile.user_id });
      await base44.entities.UserProfile.update(profile.id, { follower_count: followerCount + 1 });
      setFollowerCount(c => c + 1);
      setIsFollowing(true);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Samlarprofilen hittades inte.</p>
          <Link to="/" className="text-sm text-primary mt-3 inline-block hover:underline">← Hem</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const isOwnProfile = currentUser?.id === profile.user_id;
  const collectionPlants = plants.filter(p => !p.is_wishlist);
  const wishlistPlants = plants.filter(p => p.is_wishlist);
  const rarePlants = collectionPlants.filter(p => p.is_rare);
  const favoritePlants = collectionPlants.filter(p => p.favorite_species);
  const totalValue = collectionPlants.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const uniqueSpecies = new Set(collectionPlants.map(p => p.scientific_name || p.plant_name)).size;
  const rareScore = collectionPlants.length > 0
    ? Math.round((collectionPlants.reduce((s, p) => s + (p.rarity_score || 0), 0) / collectionPlants.length) * 10)
    : 0;

  const TABS = [
    { id: "gallery", label: "Galleri" },
    { id: "stats", label: "Statistik" },
    { id: "journal", label: "Växtjournal" },
    { id: "wishlist", label: `Önskelista (${wishlistPlants.length})` },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Hem</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Samlare · @{slug}</span>
          </nav>
        </div>

        {/* Cover */}
        <div className="relative h-44 sm:h-64 bg-gradient-to-br from-emerald-900 via-primary/60 to-secondary overflow-hidden mt-3">
          {profile.cover_url && <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Avatar row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-6 relative z-10">
            <div className="w-24 h-24 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-xl shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="font-display text-3xl text-primary">{(profile.display_name || slug || "?")[0].toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 pb-1">
              <Button variant="outline" size="sm" onClick={handleCopyUrl} className="rounded-xl gap-2 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Kopierat!" : "Dela samling"}
              </Button>
              {isOwnProfile ? (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/profile/edit">Redigera</Link>
                </Button>
              ) : (
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} className="rounded-xl gap-2">
                  {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? "Följer" : "Följ"}
                </Button>
              )}
            </div>
          </div>

          {/* Profile info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-3xl text-foreground">{profile.display_name || slug}</h1>
              {profile.is_verified && <CheckCircle className="w-5 h-5 text-primary" />}
              {profile.verification_type === "trusted_collector" && (
                <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Betrodd samlare
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">@{slug} · Växtsamlare</p>
            {profile.bio && <p className="text-sm text-muted-foreground max-w-xl mb-3">{profile.bio}</p>}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {(profile.city || profile.country) && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
              )}
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <Instagram className="w-3 h-3" />@{profile.instagram}
                </a>
              )}
              {profile.created_date && (
                <span>Samlare sedan {format(new Date(profile.created_date), "MMMM yyyy", { locale: sv })}</span>
              )}
            </div>
          </motion.div>

          {/* Key stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Antal växter", value: collectionPlants.length, icon: Leaf, color: "text-primary" },
              { label: "Unika arter", value: uniqueSpecies, icon: Sparkles, color: "text-blue-500" },
              { label: "Sällsynta", value: rarePlants.length, icon: Star, color: "text-amber-500" },
              { label: "Samlarvärde", value: totalValue > 0 ? `${totalValue.toLocaleString("sv-SE")} kr` : "—", icon: TrendingUp, color: "text-emerald-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-2xl border border-border/60 p-4 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
                <div className="font-display text-xl text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Rare score */}
          {rareScore > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">Sällsynthetsscore</span>
                  <span className="font-display text-xl text-amber-600">{rareScore}<span className="text-sm text-muted-foreground">/100</span></span>
                </div>
                <div className="w-full h-2 bg-amber-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${rareScore}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Favorite species */}
          {favoritePlants.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display text-lg text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" /> Favoritarter
              </h2>
              <div className="flex gap-2 flex-wrap">
                {favoritePlants.map(p => (
                  <Badge key={p.id} variant="secondary" className="rounded-xl text-xs px-3 py-1.5">
                    {p.plant_name}
                    {p.scientific_name && <span className="italic text-muted-foreground ml-1">· {p.scientific_name}</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/60 mb-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pb-16">
            {activeTab === "gallery" && (
              <CollectorGallery plants={collectionPlants} isOwnProfile={isOwnProfile} onUpdate={setPlants} userId={profile.user_id} />
            )}
            {activeTab === "stats" && <CollectorStats plants={collectionPlants} />}
            {activeTab === "journal" && <PlantJournalTimeline userId={profile.user_id} isOwnProfile={isOwnProfile} plants={collectionPlants} />}
            {activeTab === "wishlist" && <CollectorWishlist plants={wishlistPlants} isOwnProfile={isOwnProfile} onUpdate={setPlants} userId={profile.user_id} />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}