import { Mail, Leaf, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Here you would send the email to your newsletter service
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Newsletter signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary rounded-3xl p-10 sm:p-16 text-center">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Weekly Newsletter</span>
            </div>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
            Weekly Plant Tips & Deals
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get plant care tips, exclusive deals, auction highlights, and trending plants delivered to your inbox every week.
          </p>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                <span className="text-2xl">✓</span>
                Thanks for subscribing! Check your email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-12 rounded-2xl"
                />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                size="lg"
                className="bg-primary hover:bg-primary/90 rounded-2xl px-8 gap-2"
              >
                Subscribe
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          )}

          <p className="text-sm text-muted-foreground mt-6">
            We'll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}