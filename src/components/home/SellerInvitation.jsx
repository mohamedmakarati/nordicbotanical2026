import { Store, TrendingUp, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SellerInvitation() {
  const benefits = [
    {
      icon: Users,
      title: 'Reach More Buyers',
      description: 'Connect with thousands of plant enthusiasts across Sweden'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Sales',
      description: 'Get visible in our marketplace and price comparison tools'
    },
    {
      icon: Lock,
      title: 'Trusted Platform',
      description: 'Verified sellers with transparent ratings and secure transactions'
    },
    {
      icon: Store,
      title: 'Easy Management',
      description: 'Simple dashboard to list, manage, and track your plants'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <Store className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">For Sellers</span>
                </div>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl text-foreground">
                Grow Your Plant Business
              </h2>
              <p className="text-lg text-muted-foreground">
                Are you a nursery, garden center, or plant seller? Join our verified marketplace and reach thousands of plant buyers across Sweden.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-accent/20">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/seller/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Become a Seller - It's Free!
              </Button>
            </Link>
          </div>

          {/* Image */}
          <div className="relative h-96 rounded-3xl overflow-hidden shadow-lg hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80"
              alt="Seller benefits"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}