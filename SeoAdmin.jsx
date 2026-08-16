import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldAlert, LayoutDashboard, Search, FileText, Link2, Map, Settings, Users, Gavel, BarChart3, Mail, DollarSign, Shield, Sparkles, Globe, Tag, Bot, ChevronRight, Menu, X } from "lucide-react";
import Header from "@/components/Header";
import SeoDashboard from "@/components/seo-admin/SeoDashboard";
import SeoAIGenerator from "@/components/seo-admin/SeoAIGenerator";
import SeoPageGenerator from "@/components/seo-admin/SeoPageGenerator";
import SeoKeywordResearch from "@/components/seo-admin/SeoKeywordResearch";
import SeoContentManager from "@/components/seo-admin/SeoContentManager";
import SeoSitemapManager from "@/components/seo-admin/SeoSitemapManager";
import SeoRedirectManager from "@/components/seo-admin/SeoRedirectManager";
import AdminSellerApproval from "@/components/admin/AdminSellerApproval";
import AdminAuctions from "@/components/admin/AdminAuctions";
import AdminSellerManagement from "@/components/seo-admin/AdminSellerManagement";
import AdminBuyerManagement from "@/components/seo-admin/AdminBuyerManagement";
import AdminAnalytics from "@/components/seo-admin/AdminAnalytics";
import AdminMonetization from "@/components/seo-admin/AdminMonetization";
import SeoCategoryManager from "@/components/seo-admin/SeoCategoryManager";

const NAV = [
  { id: "seo_dashboard", label: "SEO Översikt", icon: LayoutDashboard, group: "SEO" },
  { id: "ai_generator", label: "AI SEO Generator", icon: Sparkles, group: "SEO" },
  { id: "page_generator", label: "Sidgenerator", icon: Globe, group: "SEO" },
  { id: "category_seo", label: "Kategori SEO", icon: Tag, group: "SEO" },
  { id: "keywords", label: "Nyckelord", icon: Search, group: "SEO" },
  { id: "content", label: "Innehåll", icon: FileText, group: "SEO" },
  { id: "sitemap", label: "Sitemap", icon: Map, group: "SEO" },
  { id: "redirects", label: "Omdirigeringar", icon: Link2, group: "SEO" },
  { id: "sellers", label: "Säljare", icon: Users, group: "Hantera" },
  { id: "seller_approval", label: "Godkänn säljare", icon: Shield, group: "Hantera" },
  { id: "buyers", label: "Köpare", icon: Users, group: "Hantera" },
  { id: "auctions", label: "Auktioner", icon: Gavel, group: "Hantera" },
  { id: "analytics", label: "Analys", icon: BarChart3, group: "Data" },
  { id: "monetization", label: "Intäkter", icon: DollarSign, group: "Data" },
  { id: "ai_scraper", label: "AI Scraper", icon: Bot, group: "Data" },
];

export default function SeoAdmin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("seo_dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user || user.role !== "admin") return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-foreground mb-2">Åtkomst nekad</h2>
          <p className="text-muted-foreground text-sm">Endast administratörer har tillgång.</p>
        </div>
      </div>
    </div>
  );

  const groups = [...new Set(NAV.map(n => n.group))];
  const activeItem = NAV.find(n => n.id === active);

  const renderContent = () => {
    switch (active) {
      case "seo_dashboard": return <SeoDashboard />;
      case "ai_generator": return <SeoAIGenerator />;
      case "page_generator": return <SeoPageGenerator />;
      case "category_seo": return <SeoCategoryManager />;
      case "keywords": return <SeoKeywordResearch />;
      case "content": return <SeoContentManager />;
      case "sitemap": return <SeoSitemapManager />;
      case "redirects": return <SeoRedirectManager />;
      case "sellers": return <AdminSellerManagement />;
      case "seller_approval": return <AdminSellerApproval />;
      case "buyers": return <AdminBuyerManagement />;
      case "auctions": return <AdminAuctions />;
      case "analytics": return <AdminAnalytics />;
      case "monetization": return <AdminMonetization />;
      case "ai_scraper": return <div className="p-4 text-muted-foreground text-sm">AI Scraper-hantering finns under <a href="/admin" className="text-primary underline">Admin Dashboard → AI Scraper</a>.</div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-40 w-64 bg-card border-r border-border/50 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border/40 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Search className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">SEO Admin</p>
            <p className="text-[10px] text-muted-foreground">NordicBotanical.com</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {groups.map(group => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">{group}</p>
              <div className="space-y-0.5">
                {NAV.filter(n => n.group === group).map(item => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  return (
                    <button key={item.id} onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground">Inloggad som <strong>{user.full_name}</strong></p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-16 border-b border-border/40 flex items-center gap-3 px-4 sm:px-6 bg-card/80 backdrop-blur-xl sticky top-0 z-20">
          <button className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>SEO Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{activeItem?.label}</span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}