import { Gavel, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AuctionSection() {
  const activeAuctions = [
    {
      title: 'Rare Monstera Variegata',
      currentBid: 1200,
      bids: 8,
      timeLeft: '2h 30m',
      image: 'https://images.unsplash.com/photo-1611080626919-bc8985537873?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Anthurium Clarinervium Pair',
      currentBid: 850,
      bids: 12,
      timeLeft: '5h 15m',
      image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Hoya Kerrii Variegata',
      currentBid: 450,
      bids: 5,
      timeLeft: '1h 45m',
      image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd8f2c0e?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between mb-12 gap-8">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
              Live Plant Auctions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Bid on rare and exclusive plants. Real-time auctions with verified sellers and transparent bidding.
            </p>
          </div>
        </div>

        {/* Auctions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {activeAuctions.map((auction, idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
                {/* Time left badge */}
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                  <Clock className="w-4 h-4" />
                  {auction.timeLeft}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-foreground mb-3">{auction.title}</h3>

                <div className="space-y-3 pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Bid</p>
                    <p className="text-2xl font-bold text-primary">{auction.currentBid} SEK</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    {auction.bids} bids placed
                  </div>
                </div>

                <Link to="/auctions" className="w-full mt-4 block">
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                    Place Bid
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/auctions">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <Gavel className="w-5 h-5" />
              View All Auctions
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}