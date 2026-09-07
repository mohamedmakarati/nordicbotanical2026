import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlantAssistant from "@/components/assistant/PlantAssistant";
import HeroSection from "@/components/home/HeroSection";
import SearchSection from "@/components/home/SearchSection";
import BestDeals from "@/components/home/BestDeals";
import MarketplaceSection from "@/components/home/MarketplaceSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <SearchSection />
        <BestDeals />
        <MarketplaceSection />
      </main>
      <Footer />
      <PlantAssistant />
    </div>
  );
}