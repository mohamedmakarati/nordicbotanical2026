import { Search, Leaf, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary to-white opacity-60" />
      
      {/* Large plant image background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1520763185298-1b434c919eba?auto=format&fit=crop&w=1200&q=80)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="font-display text-5xl sm:text-6xl text-foreground leading-tight">
                Discover, Compare & Buy Plants Smarter
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Nordic Botanical helps you compare plant prices, identify plants with AI, join auctions, and find trusted sellers across Sweden.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/price-comparison" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 gap-2">
                  <Zap className="w-5 h-5" /> Compare Prices
                </Button>
              </Link>
              <Link to="/identify" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <Search className="w-5 h-5" /> Identify Plant
                </Button>
              </Link>
              <Link to="/seller/register" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2">
                  <Leaf className="w-5 h-5" /> Become a Seller
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col gap-3 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">50+</div>
                <div>
                  <p className="font-semibold text-foreground">Verified Sellers</p>
                  <p className="text-sm text-muted-foreground">Swedish plant retailers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">5K+</div>
                <div>
                  <p className="font-semibold text-foreground">Plant Varieties</p>
                  <p className="text-sm text-muted-foreground">Searchable database</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hero image */}
          <div className="relative hidden lg:block h-96">
            <img 
              src="https://images.unsplash.com/photo-1508909546519-27dbc8a0b1b5?auto=format&fit=crop&w=600&q=80" 
              alt="Beautiful plant collection" 
              className="w-full h-full object-cover rounded-3xl shadow-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}