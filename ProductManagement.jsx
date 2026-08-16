import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDashboard from "@/components/products/ProductDashboard";
import ProductList from "@/components/products/ProductList";
import ProductImport from "@/components/products/ProductImport";
import ProductExport from "@/components/products/ProductExport";
import ProductBulkEdit from "@/components/products/ProductBulkEdit";
import ProductAICleaner from "@/components/products/ProductAICleaner";
import ProductSEO from "@/components/products/ProductSEO";
import ProductDuplicates from "@/components/products/ProductDuplicates";
import SmartImport from "@/components/products/SmartImport";
import BulkImportWizard from "@/components/products/BulkImportWizard";
import ProductScraper from "@/components/products/ProductScraper";
import ScraperResultsReview from "@/components/scraper/ScraperResultsReview";
import { ShieldAlert, LayoutDashboard, List, Upload, Download, Edit3, Sparkles, Globe, Copy, Wand2, Layers, Scan, ClipboardCheck } from "lucide-react";

export default function ProductManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
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
          <p className="text-muted-foreground text-sm">Du måste vara admin för att se denna sida.</p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { value: "scraper", label: "Skrapa Butik", icon: Scan },
    { value: "review", label: "Väntande Godkännande", icon: ClipboardCheck },
    { value: "smart-import", label: "Smart Import", icon: Wand2 },
    { value: "bulk-import", label: "Bulk Import", icon: Layers },
    { value: "dashboard", label: "Översikt", icon: LayoutDashboard },
    { value: "products", label: "Produkter", icon: List },
    { value: "import", label: "Importera", icon: Upload },
    { value: "export", label: "Exportera", icon: Download },
    { value: "bulk", label: "Massredigering", icon: Edit3 },
    { value: "ai", label: "AI Rensning", icon: Sparkles },
    { value: "seo", label: "SEO", icon: Globe },
    { value: "duplicates", label: "Dubbletter", icon: Copy },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-foreground">Produkthantering</h1>
          <p className="text-muted-foreground text-sm mt-1">Komplett system för att hantera, importera och optimera produkter.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto gap-1 flex-wrap mb-6 bg-muted/50 rounded-xl p-1 w-max min-w-full">
              {tabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="rounded-lg gap-2 text-sm">
                  <Icon className="w-4 h-4" />{label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="scraper"><ProductScraper /></TabsContent>
          <TabsContent value="review"><ScraperResultsReview filterStatus="pending" /></TabsContent>
          <TabsContent value="smart-import"><SmartImport /></TabsContent>
          <TabsContent value="bulk-import"><BulkImportWizard /></TabsContent>
          <TabsContent value="dashboard"><ProductDashboard /></TabsContent>
          <TabsContent value="products"><ProductList /></TabsContent>
          <TabsContent value="import"><ProductImport /></TabsContent>
          <TabsContent value="export"><ProductExport /></TabsContent>
          <TabsContent value="bulk"><ProductBulkEdit /></TabsContent>
          <TabsContent value="ai"><ProductAICleaner /></TabsContent>
          <TabsContent value="seo"><ProductSEO /></TabsContent>
          <TabsContent value="duplicates"><ProductDuplicates /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}