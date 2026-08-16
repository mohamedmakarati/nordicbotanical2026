import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlantAssistant from "@/components/assistant/PlantAssistant";
import HeroSection from "@/components/home/HeroSection";
import SearchSection from "@/components/home/SearchSection";
import AIAssistantCard from "@/components/home/AIAssistantCard";
import PriceComparisonCard from "@/components/home/PriceComparisonCard";
import MarketplaceSection from "@/components/home/MarketplaceSection";
import AuctionSection from "@/components/home/AuctionSection";
import SellerInvitation from "@/components/home/SellerInvitation";
import BlogPreview from "@/components/home/BlogPreview";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import WhyNordicBotanical from "@/components/home/WhyNordicBotanical";
import HowItWorks from "@/components/home/HowItWorks";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />
        
        {/* 2. Search Bar */}
        <SearchSection />
        
        {/* Why Nordic Botanical */}
        <WhyNordicBotanical />

        {/* How the service works */}
        <HowItWorks />

        {/* 3. AI Plant Assistant */}
        <AIAssistantCard />
        
        {/* 4. Price Comparison */}
        <PriceComparisonCard />
        
        {/* 5. Plant Marketplace */}
        <MarketplaceSection />
        
        {/* 6. Plant Auctions */}
        <AuctionSection />
        
        {/* 7. Seller Invitation */}
        <SellerInvitation />
        
        {/* 8. Blog / Plant Care Guides */}
        <BlogPreview />
        
        {/* 9. Newsletter Signup */}
        <NewsletterSignup />
      </main>
      
      {/* 10. Footer */}
      <Footer />
      
      {/* Floating Plant Assistant */}
      <PlantAssistant />
    </div>
  );
}