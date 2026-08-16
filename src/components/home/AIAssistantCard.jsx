import { Sparkles, Upload, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AIAssistantCard() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative h-80 rounded-3xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1622821951160-fb0bbb876d13?auto=format&fit=crop&w=600&q=80"
              alt="AI Plant Identifier"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="inline-block">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI-Powered</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-4xl sm:text-5xl text-foreground">
                Identify Any Plant Instantly
              </h2>
              <p className="text-lg text-muted-foreground">
                Take a photo of any plant and our AI identifies it in seconds. Get care tips, find sellers, check prices, and see if it's available at auctions.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                    <Upload className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Upload Photo</h3>
                  <p className="text-sm text-muted-foreground">Take a photo from your phone or upload</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Instant Results</h3>
                  <p className="text-sm text-muted-foreground">Get the plant name, species, and care guide</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Find Best Prices</h3>
                  <p className="text-sm text-muted-foreground">See where to buy and current auction prices</p>
                </div>
              </div>
            </div>

            <Link to="/identify">
              <Button size="lg" className="bg-accent hover:bg-accent/90 gap-2">
                <Sparkles className="w-5 h-5" />
                Try AI Identifier Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}