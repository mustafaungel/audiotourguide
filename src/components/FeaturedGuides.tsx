import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Clock, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useViralTracking } from '@/hooks/useViralTracking';
import { OptimizedImage } from '@/components/OptimizedImage';

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
}

export const FeaturedGuides = () => {
  const [guides, setGuides] = useState<AudioGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackEngagement } = useViralTracking();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('is_published', true)
        .eq('is_approved', true)
        .eq('is_standalone', true)
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

  const handleGuideClick = (guide: AudioGuide) => {
    // Fire-and-forget tracking
    trackEngagement('view', guide.id);
    navigate(`/guide/${guide.id}`, {
      state: {
        guidePreview: {
          id: guide.id,
          title: guide.title,
          description: guide.description,
          location: guide.location,
          price: guide.price_usd,
          duration: guide.duration,
          category: guide.category,
          difficulty: guide.difficulty,
          imageUrl: guide.image_url,
        }
      }
    });
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const formatDuration = (durationValue: number) => {
    // Duration is stored in seconds in the database
    const minutes = Math.floor(durationValue / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      cultural: 'bg-blue-100 text-blue-800',
      historical: 'bg-amber-100 text-amber-800',
      adventure: 'bg-green-100 text-green-800',
      scenic: 'bg-purple-100 text-purple-800',
      urban: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
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
              {[...Array(6)].map((_, i) => (
                <CarouselItem key={i} className="pl-2 basis-[85%] sm:basis-[75%] md:basis-1/2 lg:basis-1/3">
                  <Card className="animate-pulse mobile-card">
                    <div className="aspect-mobile bg-muted rounded-t-lg"></div>
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="mobile-spacing">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
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
              <CarouselItem key={guide.id} className="pl-2 basis-[85%] sm:basis-[75%] md:basis-1/2 lg:basis-1/3">{/* Mobile-first carousel items */}
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden mobile-card cursor-pointer" onClick={() => handleGuideClick(guide)}>
                  <div className="relative aspect-mobile overflow-hidden">
                    <OptimizedImage
                      src={guide.image_url}
                      alt={guide.title}
                      width={600}
                      quality={80}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={getCategoryColor(guide.category)}>
                        {guide.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-black/50 text-white">
                        {formatPrice(guide.price_usd)}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="mobile-subheading line-clamp-2">{guide.title}</CardTitle>
                    <CardDescription className="mobile-caption line-clamp-2">{guide.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="mobile-spacing">
                      <div className="flex items-center gap-4 mobile-caption text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{guide.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(guide.duration)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mobile-caption">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{guide.rating || 0}</span>
                          <span className="text-muted-foreground">({guide.total_reviews || 0})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{guide.languages.length} languages</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="mobile-caption">
                          {guide.difficulty}
                        </Badge>
                        <div className="flex gap-1">
                          {guide.languages.slice(0, 2).map((lang) => (
                            <Badge key={lang} variant="outline" className="mobile-caption">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4 touch-target"
                        onClick={() => handleGuideClick(guide.id)}
                      >
                        Explore Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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