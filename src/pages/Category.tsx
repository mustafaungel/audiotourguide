import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { GuideCard } from '@/components/GuideCard';
import { LiveExperienceCard } from '@/components/LiveExperienceCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Mountain, 
  Palette, 
  UtensilsCrossed,
  Compass,
  Filter,
  Grid,
  List,
  Star,
  MapPin,
  Clock,
  Users,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Category = () => {
  const { categoryType } = useParams<{ categoryType: string }>();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');

  const categoryInfo = {
    museums: {
      title: 'Museums & Galleries',
      description: 'Explore world-class museums and art galleries with expert guides',
      icon: Building2,
      color: 'from-blue-500 to-purple-600',
      textColor: 'text-blue-600'
    },
    historical: {
      title: 'Historical Sites',
      description: 'Journey through time at ancient monuments and historical landmarks',
      icon: Compass,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600'
    },
    nature: {
      title: 'Nature & Wildlife',
      description: 'Discover pristine landscapes and diverse ecosystems',
      icon: Mountain,
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-600'
    },
    cultural: {
      title: 'Cultural Experiences',
      description: 'Immerse yourself in local traditions and cultural heritage',
      icon: Palette,
      color: 'from-pink-500 to-rose-600',
      textColor: 'text-pink-600'
    },
    culinary: {
      title: 'Culinary Tours',
      description: 'Savor authentic flavors and learn about local food culture',
      icon: UtensilsCrossed,
      color: 'from-red-500 to-orange-600',
      textColor: 'text-red-600'
    }
  };

  const currentCategory = categoryInfo[categoryType as keyof typeof categoryInfo];

  useEffect(() => {
    if (categoryType) {
      fetchCategoryContent();
    }
  }, [categoryType, sortBy]);

  const fetchCategoryContent = async () => {
    try {
      setLoading(true);
      
      // Fetch guides from Supabase
      const { data: guidesData, error: guidesError } = await supabase
        .from('audio_guides')
        .select('*')
        .eq('category', categoryType)
        .eq('is_published', true)
        .eq('is_approved', true);

      if (guidesError) {
        console.error('Error fetching guides:', guidesError);
        setGuides([]);
      } else {
        // Get creator info separately for each guide
        const guidesWithCreators = await Promise.all(
          (guidesData || []).map(async (guide) => {
            if (guide.creator_id) {
              const { data: creatorData } = await supabase
                .from('profiles')
                .select('user_id, full_name, avatar_url')
                .eq('user_id', guide.creator_id)
                .single();
              
              return {
                ...guide,
                creator: creatorData ? {
                  id: creatorData.user_id,
                  full_name: creatorData.full_name,
                  avatar_url: creatorData.avatar_url
                } : null
              };
            }
            return { ...guide, creator: null };
          })
        );
        setGuides(guidesWithCreators);
      }

      // Fetch experiences from Supabase
      const { data: experiencesData, error: experiencesError } = await supabase
        .from('live_experiences')
        .select('*')
        .eq('category', categoryType)
        .eq('is_active', true);

      if (experiencesError) {
        console.error('Error fetching experiences:', experiencesError);
        setExperiences([]);
      } else {
        // Get creator info separately for each experience
        const experiencesWithCreators = await Promise.all(
          (experiencesData || []).map(async (exp) => {
            if (exp.creator_id) {
              const { data: creatorData } = await supabase
                .from('profiles')
                .select('user_id, full_name, avatar_url')
                .eq('user_id', exp.creator_id)
                .single();
              
              return {
                ...exp,
                creator: creatorData ? {
                  id: creatorData.user_id,
                  full_name: creatorData.full_name,
                  avatar_url: creatorData.avatar_url
                } : null
              };
            }
            return { ...exp, creator: null };
          })
        );
        setExperiences(experiencesWithCreators);
      }
    } catch (error) {
      console.error('Error fetching category content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load category content.",
      });
      setGuides([]);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Category not found</h1>
            <Button onClick={() => navigate('/')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = currentCategory.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${currentCategory.color} text-white py-16`}>
        <div className="container mx-auto px-4 text-center">
          <IconComponent className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentCategory.title}</h1>
          <p className="text-xl mb-6 max-w-2xl mx-auto">{currentCategory.description}</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span>{guides.length + experiences.length} experiences</span>
            </div>
            {guides.length > 0 && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-current" />
                <span>
                  {(guides.reduce((sum, g) => sum + (g.rating || 0), 0) / guides.length).toFixed(1)} average rating
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-background"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({guides.length + experiences.length})</TabsTrigger>
              <TabsTrigger value="guides">Audio Guides ({guides.length})</TabsTrigger>
              <TabsTrigger value="experiences">Live Experiences ({experiences.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {guides.length === 0 && experiences.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no guides or experiences in this category yet.
                  </p>
                  <Button onClick={() => navigate('/')} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Explore Other Categories
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {guides.map((guide) => (
                    <GuideCard 
                      key={guide.id}
                      id={guide.id}
                      title={guide.title}
                      description={guide.description}
                      location={guide.location}
                      price={guide.price_usd}
                      rating={guide.rating}
                      duration={guide.duration}
                      category={guide.category}
                      difficulty={guide.difficulty}
                      imageUrl={guide.image_url}
                      creatorId={guide.creator?.id}
                      creatorName={guide.creator?.full_name}
                      creatorAvatar={guide.creator?.avatar_url}
                      totalPurchases={guide.total_purchases}
                    />
                  ))}
                  {experiences.map((experience) => (
                    <LiveExperienceCard key={experience.id} experience={experience} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="guides" className="mt-6">
              {guides.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">No Audio Guides</h3>
                  <p className="text-muted-foreground">
                    No audio guides are available in this category yet.
                  </p>
                </div>
              ) : (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {guides.map((guide) => (
                    <GuideCard 
                      key={guide.id}
                      id={guide.id}
                      title={guide.title}
                      description={guide.description}
                      location={guide.location}
                      price={guide.price_usd}
                      rating={guide.rating}
                      duration={guide.duration}
                      category={guide.category}
                      difficulty={guide.difficulty}
                      imageUrl={guide.image_url}
                      creatorId={guide.creator?.id}
                      creatorName={guide.creator?.full_name}
                      creatorAvatar={guide.creator?.avatar_url}
                      totalPurchases={guide.total_purchases}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="experiences" className="mt-6">
              {experiences.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">No Live Experiences</h3>
                  <p className="text-muted-foreground">
                    No live experiences are available in this category yet.
                  </p>
                </div>
              ) : (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {experiences.map((experience) => (
                    <LiveExperienceCard key={experience.id} experience={experience} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Category;