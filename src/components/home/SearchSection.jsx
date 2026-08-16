import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const suggestedSearches = [
    'Monstera', 'Orchids', 'Philodendron', 'Indoor plants', 'Rare plants', 'Budget plants'
  ];

  return (
    <section className="bg-secondary py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-2">
            Find Your Next Plant
          </h2>
          <p className="text-muted-foreground">
            Search by plant name, type, price, or availability
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search plants, prices, auctions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 text-lg rounded-2xl border-2 border-border focus:border-primary"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <Button 
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 rounded-2xl px-8"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Suggested searches */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedSearches.map((search) => (
              <button
                key={search}
                onClick={() => {
                  setSearchQuery(search);
                  navigate(`/search?q=${encodeURIComponent(search)}`);
                }}
                className="px-4 py-2 bg-white rounded-full text-sm text-foreground border border-border hover:bg-muted transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}