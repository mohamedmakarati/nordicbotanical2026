import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import SearchPage from '@/pages/SearchPage';
import SellerDirectory from '@/pages/SellerDirectory';
import AdminDashboard from '@/pages/AdminDashboard';
import PriceHistory from '@/pages/PriceHistory';
import Wishlist from '@/pages/Wishlist';
import PlantsHub from '@/pages/PlantsHub';
import PlantCategoryPage from '@/pages/PlantCategoryPage';
import PlantDetailPage from '@/pages/PlantDetailPage';
import AuctionMarketplace from '@/pages/AuctionMarketplace';
import AuctionDetail from '@/pages/AuctionDetail';
import CreateAuction from '@/pages/CreateAuction';
import AuctionDashboard from '@/pages/AuctionDashboard';
import SellerProfile from '@/pages/SellerProfile';
import UserProfilePage from '@/pages/UserProfilePage';
import EditProfile from '@/pages/EditProfile';
import CollectorProfile from '@/pages/CollectorProfile';
import NurseryProfilePage from '@/pages/NurseryProfilePage';
import AIProductTraining from '@/pages/AIProductTraining';
import DealsPage from '@/pages/DealsPage';
import PlantIdentifier from '@/pages/PlantIdentifier';
import BuyerDashboard from '@/pages/BuyerDashboard';
import Blog from '@/pages/Blog';
import Contact from '@/pages/Contact';
import About from '@/pages/About';
import PriceComparison from '@/pages/PriceComparison';
import SellerRegistration from '@/pages/SellerRegistration';
import AuctionCheckout from '@/pages/AuctionCheckout';
import SeoPage from '@/pages/SeoPage';
import SeoAdmin from '@/pages/SeoAdmin';
import ProductManagement from '@/pages/ProductManagement';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/sellers" element={<SellerDirectory />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/price-history" element={<PriceHistory />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/plants" element={<PlantsHub />} />
      <Route path="/plants/:category" element={<PlantCategoryPage />} />
      <Route path="/plant/:slug" element={<PlantDetailPage />} />
      <Route path="/auctions" element={<AuctionMarketplace />} />
      <Route path="/auctions/sell" element={<CreateAuction />} />
      <Route path="/auctions/dashboard" element={<AuctionDashboard />} />
      <Route path="/auctions/:id" element={<AuctionDetail />} />
      <Route path="/sellers/:slug" element={<SellerProfile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/profile/:username" element={<UserProfilePage />} />
      <Route path="/collector/:slug" element={<CollectorProfile />} />
      <Route path="/nursery/:slug" element={<NurseryProfilePage />} />
      <Route path="/admin/training" element={<AIProductTraining />} />
      <Route path="/deals" element={<DealsPage />} />
      <Route path="/identify" element={<PlantIdentifier />} />
      <Route path="/dashboard" element={<BuyerDashboard />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/price-comparison" element={<PriceComparison />} />
      <Route path="/seller/register" element={<SellerRegistration />} />
      <Route path="/auctions/:id/checkout" element={<AuctionCheckout />} />
      <Route path="/guide/:slug" element={<SeoPage />} />
      <Route path="/seo-admin" element={<SeoAdmin />} />
      <Route path="/products-admin" element={<ProductManagement />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App