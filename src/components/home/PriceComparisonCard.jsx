import { TrendingDown, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function PriceComparisonCard() {
  const examples = [
    { plant: 'Monstera deliciosa', highest: 599, lowest: 199, savings: 400 },
    { plant: 'Philodendron Pink Princess', highest: 799, lowest: 249, savings: 550 },
    { plant: 'Pothos Golden', highest: 199, lowest: 49, savings: 150 }
  ];

  return (
    <section className="py-16 sm:py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Save Money</span>
            </div>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Compare Plant Prices Across Sweden
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We compare prices from 50+ Swedish sellers so you always get the best deal. See price trends and save hundreds of SEK.
          </p>
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg mb-8 overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-semibold text-foreground">Plant Name</th>
                <th className="text-right py-4 px-4 font-semibold text-foreground">Highest Price</th>
                <th className="text-right py-4 px-4 font-semibold text-foreground">Lowest Price</th>
                <th className="text-right py-4 px-4 font-semibold text-accent">Save</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((item, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0 hover:bg-muted transition-colors">
                  <td className="py-4 px-4 text-foreground font-medium">{item.plant}</td>
                  <td className="py-4 px-4 text-right text-muted-foreground">{item.highest} SEK</td>
                  <td className="py-4 px-4 text-right text-foreground font-semibold">{item.lowest} SEK</td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-block bg-accent/10 text-accent font-bold px-3 py-1 rounded-full">
                      {item.savings} SEK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Real-Time Prices</h3>
                <p className="text-sm text-muted-foreground mt-1">Updated daily from all major sellers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Price History</h3>
                <p className="text-sm text-muted-foreground mt-1">See trends and best times to buy</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Price Alerts</h3>
                <p className="text-sm text-muted-foreground mt-1">Get notified when prices drop</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/price-comparison">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <Zap className="w-5 h-5" />
              Start Comparing Prices
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}