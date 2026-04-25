import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GuideCard } from '@/components/GuideCard';
import { Navigation } from '@/components/Navigation';
import { lazy, Suspense } from 'react';
const Footer = lazy(() => import('@/components/Footer').then(m => ({ default: m.Footer })));
import { Button } from '@/components/ui/button';
import { Headphones, Filter, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { ExploreSegmentedNav } from '@/components/ExploreSegmentedNav';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { saveScrollPosition, readScrollPosition, smoothScrollTo } from '@/lib/scroll-memory';

const SCROLL_KEY = 'guides-list';

const Guides = () => {
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cached query — no refetch on back navigation
  const { data: guides = [], isLoading: loading } = useQuery({
    queryKey: ['guides-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (user) fetchUserPurchases();
  }, [user]);

  // Continuously save scroll position so we can restore it when returning from detail.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveScrollPosition(SCROLL_KEY, window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Restore scroll position when the list finishes loading.
  useEffect(() => {
    if (loading) return;
    const y = readScrollPosition(SCROLL_KEY);
    if (y == null || y <= 0) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        smoothScrollTo(y);
      });
    });
  }, [loading]);

  const fetchUserPurchases = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('guide_id')
        .eq('user_id', user.id);
      if (error) throw error;
      setUserPurchases(data?.map(p => p.guide_id) || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handlePurchaseGuide = async (guideId: string) => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to purchase guides", variant: "destructive" });
      return;
    }
    if (processingPayment === guideId) return;
    setProcessingPayment(guideId);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', { body: { guideId } });
      if (error) throw error;
      if (!data?.url) throw new Error('No payment URL received');
      window.open(data.url, '_blank');
      toast({ title: "Payment Started", description: "Redirecting to secure checkout..." });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({ title: "Payment Error", description: error.message || "Failed to initiate payment.", variant: "destructive" });
    } finally {
      setTimeout(() => setProcessingPayment(null), 2000);
    }
  };

  // Unique categories from guides
  const categories = useMemo(() => {
    const cats = [...new Set(guides.map(g => g.category))].filter(Boolean).sort();
    return cats;
  }, [guides]);

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    const items: { label: string; sublabel?: string; type: 'guide' | 'location'; slug?: string; id?: string }[] = [];
    const seenLocations = new Set<string>();
    guides.forEach(g => {
      items.push({ label: g.title, sublabel: g.location, type: 'guide', slug: g.slug, id: g.id });
      if (!seenLocations.has(g.location)) {
        seenLocations.add(g.location);
        items.push({ label: g.location, type: 'location' });
      }
    });
    return items;
  }, [guides]);

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = !searchTerm || 
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchTerm, selectedCategory]);

  const visibleGuides = filteredGuides.slice(0, visibleCount);
  const remainingCount = filteredGuides.length - visibleCount;

  const handlePlayGuide = (guide: any) => {
    setSelectedGuide(guide);
    supabase.functions.invoke('track-viral-engagement', {
      body: { action: 'view', guide_id: guide.id }
    }).catch(err => console.error('Error tracking guide view:', err));
  };

  const activeFilterCount = (selectedCategory ? 1 : 0);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://audiotourguide.app" },
      { "@type": "ListItem", "position": 2, "name": "Audio Guides", "item": "https://audiotourguide.app/guides" }
    ]
  };

  const itemListSchema = !loading && guides.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": guides.slice(0, 10).map((guide, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": guide.title,
      "item": `https://audiotourguide.app/guides/${guide.slug}`
    }))
  } : null;

  const schemas = [breadcrumbSchema];
  if (itemListSchema) schemas.push(itemListSchema);

  return (
    <div className="mobile-page-shell">
      <SEO 
        title="Browse Audio Guides | Museums, Cities & Heritage Sites"
        description="Browse expert-narrated audio guides for UNESCO sites, museums, and cultural landmarks worldwide. Multi-language support."
        canonicalUrl="https://audiotourguide.app/guides"
        structuredData={schemas}
      />
      <Navigation />
      <ExploreSegmentedNav active="guides" />

      {/* Compact header — desktop shows full hero, mobile keeps it minimal
          so the search + content appear above the fold. H1 remains in DOM
          for SEO/accessibility on every breakpoint. */}
      <h1 className="sr-only">Discover Audio Guides</h1>
      <section className="hidden md:block mobile-section relative overflow-hidden">
        <div className="audio-hero-silhouette" />
        <div className="mobile-container relative z-10">
          <div className="discover-hero-panel text-center">
            <div className="inline-flex items-center gap-2 rounded-full audio-premium-badge px-4 py-2 mb-4">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="mobile-caption font-medium">Audio Guides</span>
            </div>
            <h2 className="mobile-heading sm:text-3xl lg:text-4xl text-foreground mb-4">
              Discover Amazing Audio Guides
            </h2>
            <p className="mobile-text text-muted-foreground max-w-2xl mx-auto">
              Explore the world through immersive audio experiences. Search by destination, category, or guide name.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Guides Section */}
      <section className="mobile-section">
        <div className="mobile-container">
          {/* Search + Filter row — desktop only */}
          <div className="hidden md:flex mobile-surface mb-4 gap-2 rounded-[24px] p-3 max-w-2xl mx-auto">
            <SearchAutocomplete
              value={searchTerm}
              onChange={setSearchTerm}
              suggestions={suggestions}
              placeholder="Search by destination, category, or guide name..."
              className="flex-1"
            />
            <Button 
              variant="outline" 
              className="touch-target relative h-12 flex-shrink-0 rounded-2xl px-3"
              onClick={() => setFilterSheetOpen(true)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Category Chips — desktop only */}
          {categories.length > 0 && (
            <div className="hidden md:block max-w-2xl mx-auto mb-6 -mx-4 px-4">
              <div className="mobile-chip-row">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "mobile-filter-chip",
                    !selectedCategory 
                      ? "mobile-filter-chip-active" 
                      : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={cn(
                      "mobile-filter-chip whitespace-nowrap",
                      selectedCategory === cat 
                        ? "mobile-filter-chip-active" 
                        : "text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {(searchTerm || selectedCategory) && (
            <div className="text-center mb-6">
              <p className="mobile-caption">
                {loading ? 'Searching...' : `Found ${filteredGuides.length} result(s)${searchTerm ? ` for "${searchTerm}"` : ''}${selectedCategory ? ` in ${selectedCategory}` : ''}`}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && <AudioGuideLoader variant="card" count={6} />}

          {/* Guides Grid */}
          {!loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleGuides.map(guide => {
                const isPurchased = userPurchases.includes(guide.id);
                return (
                  <GuideCard
                    key={guide.id}
                    id={guide.id}
                    slug={guide.slug}
                    title={guide.title}
                    description={guide.description}
                    duration={guide.duration}
                    location={guide.location}
                    rating={guide.rating || 0}
                    category={guide.category}
                    price={guide.price_usd}
                    difficulty={guide.difficulty}
                    imageUrl={guide.image_urls?.[0] || guide.image_url}
                    totalPurchases={guide.total_purchases || 0}
                    languages={guide.languages}
                    isFeatured={guide.is_featured}
                    creatorName="Audio Tour Guides"
                    isProcessingPayment={processingPayment === guide.id}
                    onViewGuide={() => {
                      if (isPurchased || guide.price_usd === 0) {
                        handlePlayGuide(guide);
                      } else {
                        handlePurchaseGuide(guide.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {!loading && remainingCount > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300 active:scale-95 touch-target w-full sm:w-auto justify-center"
              >
                <Headphones className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">Discover More Audio Guides</span>
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                  {remainingCount}
                </Badge>
                <div className="flex items-end gap-[3px] h-4 ml-1">
                  <span className="w-[2px] bg-amber-500/40 rounded-full" style={{ height: '4px', animation: 'equalizer-bar 2.2s ease-in-out infinite', animationDelay: '0ms' }} />
                  <span className="w-[2px] bg-amber-500/40 rounded-full" style={{ height: '4px', animation: 'equalizer-bar 2.2s ease-in-out infinite', animationDelay: '150ms' }} />
                  <span className="w-[2px] bg-amber-500/40 rounded-full" style={{ height: '4px', animation: 'equalizer-bar 2.2s ease-in-out infinite', animationDelay: '300ms' }} />
                </div>
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredGuides.length === 0 && (
            <div className="text-center py-16 mobile-spacing">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="mobile-subheading text-foreground mb-2">No audio guides found</h3>
              <p className="mobile-caption mb-4">
                Try searching for different destinations, categories, or keywords
              </p>
              {(searchTerm || selectedCategory) && (
                <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Audio Player Section */}
      {selectedGuide && (
        <section className="mobile-padding mobile-spacing">
          <div className="mobile-container max-w-2xl">
            <div className="text-center mobile-spacing">
              <h2 className="mobile-heading text-foreground mb-2">Now Playing</h2>
              <p className="mobile-caption">Immerse yourself in the audio experience</p>
            </div>
            <AudioPlayer 
              title={selectedGuide.title}
              description={selectedGuide.description}
              guideId={selectedGuide.id}
              transcript={selectedGuide.transcript}
            />
          </div>
        </section>
      )}

      {/* Filter Bottom Sheet */}
      <BottomSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        title="Filter Guides"
      >
        <div className="py-4 space-y-6">
          {/* Category filter */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Category</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory(null); setFilterSheetOpen(false); }}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors touch-target flex items-center gap-2",
                  !selectedCategory 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {!selectedCategory && <Check className="h-3.5 w-3.5" />}
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setFilterSheetOpen(false); }}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors touch-target flex items-center gap-2",
                    selectedCategory === cat 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {selectedCategory === cat && <Check className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Clear all */}
          {selectedCategory && (
            <Button 
              variant="outline" 
              className="w-full touch-target" 
              onClick={() => { setSelectedCategory(null); setFilterSheetOpen(false); }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </BottomSheet>

      <Suspense fallback={null}><Footer /></Suspense>
    </div>
  );
};

export default Guides;
