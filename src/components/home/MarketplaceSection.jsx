import { ShoppingBag, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function MarketplaceSection() {
  const featuredPlants = [
    {
      name: 'Monstera Deliciosa',
      price: 249,
      seller: 'Green Thumb Gardens',
      location: 'Stockholm',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1611080626919-bc8985537873?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Philodendron Pink Princess',
      price: 399,
      seller: 'Nordic Plants Co',
      location: 'Gothenburg',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd8f2c0e?auto=format&fit=crop&w=400&q=80'
    },
    {
      name: 'Anthurium Clarinervium',
      price: 299,
      seller: 'Växtpalatset',
      location: 'Malmö',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Browse Plant Marketplace
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From rare collector plants to budget-friendly greenery, find quality plants from verified Swedish sellers.
          </p>
        </div>

        {/* Featured plants grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {featuredPlants.map((plant, idx) => (
            <div key={idx} className="group rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-secondary">
                <img
                  src={plant.image}
                  alt={plant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                  {plant.name}
                </h3>

                {/* Seller & Rating */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(plant.rating) ? 'fill-accent text-accent' : 'text-border'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">{plant.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {plant.location}
                  </div>
                </div>

                {/* Seller name */}
                <p className="text-sm text-muted-foreground mb-4">{plant.seller}</p>

                {/* Price & CTA */}
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl font-bold text-primary">{plant.price} SEK</div>
                  <Link to="/plants" className="flex-1">
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      View Plant
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/plants">
            <Button size="lg" variant="outline" className="gap-2">
              <ShoppingBag className="w-5 h-5" />
              Explore All Plants
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}