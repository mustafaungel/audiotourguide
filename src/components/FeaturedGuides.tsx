import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { supabase } from '@/integrations/supabase/client';
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
import { GuideCard } from '@/components/GuideCard';

interface AudioGuide {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  difficulty: string;
  duration: number;
  price_usd: number;
  image_url: string;
  rating: number;
  total_reviews: number;
  languages: string[];
  slug: string;
}

export const FeaturedGuides = () => {
  const [guides, setGuides] = useState<AudioGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('id, title, slug, description, location, category, difficulty, duration, price_usd, image_url, rating, total_reviews, languages')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) {
        console.error('Error fetching guides:', error);
        return;
      }

      setGuides(data || []);
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mobile-padding mobile-spacing">
        <div className="mobile-container">
          <div className="text-center mobile-spacing">
            <h2 className="mobile-heading sm:text-3xl text-foreground mb-4">Featured Audio Guides</h2>
            <p className="mobile-text sm:text-lg text-muted-foreground">Discover extraordinary places with expert-crafted audio tours</p>
          </div>
          <AudioGuideLoader variant="card" count={6} />
        </div>
      </section>
    );
  }

  return (
    <section className="mobile-padding mobile-spacing">
      <div className="mobile-container">
        <div className="text-center mobile-spacing">
          <h2 className="mobile-heading sm:text-3xl text-foreground mb-4">Featured Audio Guides</h2>
          <p className="mobile-text sm:text-lg text-muted-foreground">Discover extraordinary places with expert-crafted audio tours</p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {guides.map((guide) => (
              <CarouselItem key={guide.id} className="pl-2 basis-[85%] sm:basis-[75%] md:basis-1/2 lg:basis-1/3">
                <GuideCard
                  id={guide.id}
                  slug={guide.slug}
                  title={guide.title}
                  description={guide.description}
                  location={guide.location}
                  price={guide.price_usd}
                  rating={guide.rating || 0}
                  duration={guide.duration}
                  category={guide.category}
                  difficulty={guide.difficulty}
                  imageUrl={guide.image_url}
                  languages={guide.languages}
                  isFeatured={true}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};
