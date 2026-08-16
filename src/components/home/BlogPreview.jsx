import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function BlogPreview() {
  const posts = [
    {
      title: 'Så odlar du Monstera hemma - Komplett skötselguide',
      excerpt: 'Lär dig hur du sköter monstera perfekt. Tips för ljus, vatten, potting och vanliga problem.',
      category: 'Skötselguide',
      image: 'https://images.unsplash.com/photo-1611080626919-bc8985537873?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'De sällsynta växttrenden 2026 - Vad samlar växtsamlare?',
      excerpt: 'Utforska de hetaste sällsynta växterna 2026. Varför Monstera variegata är så dyr och vilka arter som blir nästa trend.',
      category: 'Trends',
      image: 'https://images.unsplash.com/photo-1508909546519-27dbc8a0b1b5?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Hur köper du växter online säkert? - Guide till e-handel 2026',
      excerpt: 'Allt du behöver veta om att köpa växter på nätet. Certifikat, frakt, returpolicy och hur du väljer säljare.',
      category: 'Köpguide',
      image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between mb-12 gap-8">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-4">
              Plant Care & Tips
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Expert guides, growing tips, and plant care advice to help your collection thrive.
            </p>
          </div>
        </div>

        {/* Blog posts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {posts.map((post, idx) => (
            <Link key={idx} to="/blog" className="group">
              <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white h-full flex flex-col">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                    Läs mer <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link to="/blog">
            <Button size="lg" variant="outline" className="gap-2">
              <BookOpen className="w-5 h-5" />
              Read All Articles
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}