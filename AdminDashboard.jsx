import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminSellers from "@/components/admin/AdminSellers";
import AdminImport from "@/components/admin/AdminImport";
import AdminStats from "@/components/admin/AdminStats";
import ScraperDashboard from "@/components/admin/ScraperDashboard";
import AdminAssistantSettings from "@/components/admin/AdminAssistantSettings";
import AdminAuctions from "@/components/admin/AdminAuctions";
import SearchConsoleDashboard from "@/components/admin/SearchConsoleDashboard";
import AdminSellerApproval from "@/components/admin/AdminSellerApproval";
import WebScraperPanel from "@/components/scraper/WebScraperPanel";
import ThunderbitPanel from "@/components/admin/ThunderbitPanel";
import ScraperResultsReview from "@/components/scraper/ScraperResultsReview";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { ShieldAlert, Sparkles, Search, Package, CheckCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl text-foreground mb-2">Åtkomst nekad</h2>
            <p className="text-muted-foreground text-sm">Du måste vara inloggad som admin för att se denna sida.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Hantera produkter, butiker och importera data.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/products-admin"
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors shrink-0">
              <Package className="w-4 h-4" /> Produkthantering
            </Link>
            <Link to="/seo-admin"
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors shrink-0">
              <Search className="w-4 h-4" /> SEO Admin
            </Link>
            <Link to="/admin/training"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
              <Sparkles className="w-4 h-4" /> AI Produktträning
            </Link>
          </div>
        </div>
        <AdminStats />
        <Tabs defaultValue="analytics" className="mt-8">
          <TabsList className="rounded-xl mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="analytics" className="rounded-lg"><BarChart3 className="w-4 h-4 mr-1" />Analys</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg">Produkter</TabsTrigger>
            <TabsTrigger value="sellers" className="rounded-lg">Butiker</TabsTrigger>
            <TabsTrigger value="import" className="rounded-lg">Importera</TabsTrigger>
            <TabsTrigger value="scraper" className="rounded-lg">AI Scraper</TabsTrigger>
            <TabsTrigger value="assistant" className="rounded-lg">AI Assistant</TabsTrigger>
            <TabsTrigger value="auctions" className="rounded-lg">Auctions</TabsTrigger>
            <TabsTrigger value="sellers_approval" className="rounded-lg">Godkänn säljare</TabsTrigger>
            <TabsTrigger value="search_console" className="rounded-lg">Search Console</TabsTrigger>
            <TabsTrigger value="web_scraper" className="rounded-lg">🌐 AI Skrapare</TabsTrigger>
            <TabsTrigger value="thunderbit" className="rounded-lg">⚡ Thunderbit</TabsTrigger>
            <TabsTrigger value="review_pending" className="rounded-lg gap-2"><CheckCircle className="w-4 h-4" /> Väntande Godkännande</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
          <TabsContent value="products"><AdminProducts /></TabsContent>
          <TabsContent value="sellers"><AdminSellers /></TabsContent>
          <TabsContent value="import"><AdminImport /></TabsContent>
          <TabsContent value="scraper"><ScraperDashboard /></TabsContent>
          <TabsContent value="assistant"><AdminAssistantSettings /></TabsContent>
          <TabsContent value="auctions"><AdminAuctions /></TabsContent>
          <TabsContent value="sellers_approval"><AdminSellerApproval /></TabsContent>
          <TabsContent value="search_console"><SearchConsoleDashboard /></TabsContent>
          <TabsContent value="web_scraper"><WebScraperPanel /></TabsContent>
          <TabsContent value="thunderbit"><ThunderbitPanel /></TabsContent>
          <TabsContent value="review_pending"><ScraperResultsReview filterStatus="pending" /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}