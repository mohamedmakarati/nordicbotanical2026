import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { motion } from "framer-motion";
import {
  Globe, MapPin, CheckCircle, Instagram, Facebook, ChevronRight,
  UserPlus, UserCheck, Star, Leaf, Package, Heart, MessageCircle, Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProfilePlantCollection from "@/components/profile/ProfilePlantCollection";
import ProfileReviews from "@/components/profile/ProfileReviews";
import ProfileTrustScore from "@/components/profile/ProfileTrustScore";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const ACCOUNT_TYPE_LABELS = {
  plant_buyer: "Växtköpare",
  plant_seller: "Växtförsäljare",
  nursery: "Plantskola",
  wholesaler: "Grossist",
  landscape_designer: "Landskapsdesigner",
  plant_collector: "Växtsamlare",
  botanical_garden: "Botanisk trädgård",
  garden_center: "Trädgårdscenter",
};

const VERIFICATION_BADGES = {
  verified_seller: { label: "Verifierad säljare", color: "bg-primary/10 text-primary" },
  verified_nursery: { label: "Verifierad plantskola", color: "bg-blue-500/10 text-blue-600" },
  verified_wholesaler: { label: "Verifierad grossist", color: "bg-purple-500/10 text-purple-600" },
  trusted_collector: { label: "Betrodd samlare", color: "bg-amber-500/10 text-amber-600" },
};

const TABS = ["Samling", "Recensioner", "Önskelista"];

export default function UserProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Samling");
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      base44.entities.UserProfile.filter({ username }),
      base44.auth.me().catch(() => null),
    ]).then(async ([profiles, me]) => {
      const found = profiles[0];
      setCurrentUser(me);
      if (found) {
        setProfile(found);
        setFollowerCount(found.follower_count || 0);
        if (me) {
          const follows = await base44.entities.Follow.filter({ follower_id: me.id, following_id: found.user_id });
          setIsFollowing(follows.length > 0);
          const wl = await base44.entities.Wishlist.filter({ created_by_id: found.user_id });
          setWishlistItems(wl);
        }
      }
      setLoading(false);
    });
  }, [username]);

  const handleFollow = async () => {
    if (!currentUser) { base44.auth.redirectToLogin(); return; }
    if (isFollowing) {
      const follows = await base44.entities.Follow.filter({ follower_id: currentUser.id, following_id: profile.user_id });
      if (follows[0]) await base44.entities.Follow.delete(follows[0].id);
      await base44.entities.UserProfile.update(profile.id, { follower_count: Math.max(0, followerCount - 1) });
      setFollowerCount((c) => Math.max(0, c - 1));
      setIsFollowing(false);
    } else {
      await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: profile.user_id });
      await base44.entities.UserProfile.update(profile.id, { follower_count: followerCount + 1 });
      setFollowerCount((c) => c + 1);
      setIsFollowing(true);
    }
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
          <p className="text-muted-foreground">Profilen hittades inte.</p>
          <Link to="/" className="text-sm text-primary mt-3 inline-block hover:underline">← Hem</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const badge = VERIFICATION_BADGES[profile.verification_type];
  const isOwnProfile = currentUser?.id === profile.user_id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={`${profile.display_name || profile.username} | NordicBotanical`}
        description={profile.bio || `${ACCOUNT_TYPE_LABELS[profile.account_type]} på NordicBotanical.com`}
        url={`https://nordicbotanical.com/profile/${profile.username}`}
        image={profile.avatar_url}
      />
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Hem</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">@{profile.username}</span>
          </nav>
        </div>

        {/* Cover photo */}
        <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary/20 via-accent to-secondary overflow-hidden">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Avatar + actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-background bg-card overflow-hidden shrink-0 shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="font-display text-3xl text-primary">{(profile.display_name || profile.username || "?")[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              {isOwnProfile ? (
                <Button asChild variant="outline" className="rounded-xl gap-2">
                  <Link to="/profile/edit">Redigera profil</Link>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="rounded-xl gap-2"
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? "Följer" : "Följ"}
                  </Button>
                  <Button variant="outline" className="rounded-xl gap-2" asChild>
                    <Link to={`/messages?user=${profile.user_id}`}>
                      <MessageCircle className="w-4 h-4" /> Meddelande
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Profile info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-3xl text-foreground">{profile.display_name || profile.username}</h1>
              {profile.is_verified && (
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="rounded-lg text-xs">
                {ACCOUNT_TYPE_LABELS[profile.account_type] || profile.account_type}
              </Badge>
              {badge && (
                <Badge className={`${badge.color} border-0 rounded-lg text-xs flex items-center gap-1`}>
                  <CheckCircle className="w-3 h-3" /> {badge.label}
                </Badge>
              )}
            </div>

            {profile.bio && <p className="text-muted-foreground text-sm max-w-xl mb-3">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {(profile.city || profile.country) && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Globe className="w-3 h-3" />{profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Instagram className="w-3 h-3" />@{profile.instagram}
                </a>
              )}
              {profile.created_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Gick med {format(new Date(profile.created_date), "MMMM yyyy", { locale: sv })}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-border/40">
              <div className="text-center">
                <div className="font-display text-xl text-foreground">{followerCount}</div>
                <div className="text-xs text-muted-foreground">Följare</div>
              </div>
              <div className="text-center">
                <div className="font-display text-xl text-foreground">{profile.following_count || 0}</div>
                <div className="text-xs text-muted-foreground">Följer</div>
              </div>
              {profile.trust_score > 0 && (
                <div className="text-center">
                  <div className="font-display text-xl text-foreground">{profile.trust_score}</div>
                  <div className="text-xs text-muted-foreground">Förtroendepoäng</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Trust score */}
          <ProfileTrustScore profile={profile} />

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/60 mb-8 mt-6">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pb-16">
            {activeTab === "Samling" && <ProfilePlantCollection userId={profile.user_id} isOwnProfile={isOwnProfile} />}
            {activeTab === "Recensioner" && <ProfileReviews profileId={profile.user_id} currentUser={currentUser} />}
            {activeTab === "Önskelista" && (
              <div>
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    <Heart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    Ingen publik önskelista ännu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="bg-card rounded-2xl border border-border/60 p-4">
                        {item.image_url && (
                          <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-muted">
                            <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="font-medium text-sm text-foreground">{item.product_title}</p>
                        <p className="text-xs text-muted-foreground">{item.seller_name} · {item.price?.toFixed(0)} {item.currency}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}