import { useState, useEffect, useRef } from "react";
import { Leaf, LayoutDashboard, Store, Menu, X, Gavel, UserCircle, Tag, Camera, LogOut, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Header() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me) {
        const profiles = await base44.entities.UserProfile.filter({ user_id: me.id }).catch(() => []);
        setUserProfile(profiles[0] || null);
      }
    }).catch(() => {});
  }, []);

  const navLinks = [
    { to: "/auctions", label: "Auktioner", icon: Gavel },
    { to: "/auctions/sell", label: "Sälj växt", icon: Tag },
    { to: "/identify", label: "AI-Identifiera", icon: Camera },
    { to: "/sellers", label: "Säljare" },
    { to: "/blog", label: "Blogg" },
    { to: "/seller/register", label: "Bli säljare", icon: Store },
  ];

  return (
    <header className={`sticky top-0 z-50 border-b border-border/50 ${isHome ? "bg-background/80 backdrop-blur-xl" : "bg-background/95 backdrop-blur-xl"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg leading-tight tracking-tight text-foreground">Nordic Botanical</span>
            <span className="text-[10px] font-body text-muted-foreground tracking-wider uppercase hidden sm:block">Jämför växtpriser</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${location.pathname === link.to ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 w-8 h-8 rounded-xl overflow-hidden border border-border/60 hover:border-primary/40 transition-colors shrink-0 bg-muted"
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-10 w-48 bg-background border border-border rounded-xl shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-xs font-medium text-foreground truncate">{user.full_name || user.email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link to={userProfile ? `/profile/${userProfile.username}` : "/profile/edit"}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <UserCircle className="w-4 h-4" /> Min profil
                  </Link>
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  {user?.role === "admin" && (
                    <Link to="/admin" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <div className="border-t border-border/50 mt-1">
                    <button onClick={() => base44.auth.logout()}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" /> Logga ut
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <Button asChild size="sm" className="rounded-xl gap-1.5 text-sm h-8 px-4">
            <Link to="/auctions"><Gavel className="w-3.5 h-3.5" /><span className="hidden sm:inline">Auktioner</span></Link>
          </Button>
          <button className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              {link.icon && <link.icon className="w-4 h-4" />} {link.label}
            </Link>
          ))}
          {user && (
            <Link to={userProfile ? `/profile/${userProfile.username}` : "/profile/edit"} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <UserCircle className="w-4 h-4" /> Min profil
            </Link>
          )}
          {user && (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Min dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}