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
      // Demo data for each category
      const demoGuides = {
        museums: [
          {
            id: 'demo-guide-1',
            title: 'Masterpieces of the Louvre',
            description: 'Discover the stories behind the world\'s most famous artworks including the Mona Lisa, Venus de Milo, and Winged Victory.',
            location: 'Paris, France',
            duration: 120,
            price_usd: 25,
            rating: 4.8,
            total_purchases: 89,
            image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
            category: 'Museums',
            difficulty: 'Beginner',
            creator: { id: 'demo-1', full_name: 'Elena Rossi', avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face' }
          },
          {
            id: 'demo-guide-2',
            title: 'Vatican Museums Deep Dive',
            description: 'An intimate journey through the Vatican\'s treasures, from Michelangelo\'s Sistine Chapel to the Renaissance Rooms.',
            location: 'Vatican City',
            duration: 180,
            price_usd: 35,
            rating: 4.9,
            total_purchases: 156,
            image_url: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800',
            category: 'Museums',
            difficulty: 'Intermediate',
            creator: { id: 'demo-1', full_name: 'Elena Rossi', avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face' }
          }
        ],
        historical: [
          {
            id: 'demo-guide-4',
            title: 'Mysteries of Machu Picchu',
            description: 'Uncover the secrets of the Lost City of the Incas with insights from recent archaeological discoveries.',
            location: 'Machu Picchu, Peru',
            duration: 240,
            price_usd: 45,
            rating: 4.9,
            total_purchases: 201,
            image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
            category: 'Archaeology',
            difficulty: 'Intermediate',
            creator: { id: 'demo-3', full_name: 'Dr. Maria Garcia', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face' }
          },
          {
            id: 'demo-guide-5',
            title: 'Secrets of the Great Pyramid',
            description: 'Explore the engineering marvels and hidden chambers of the last surviving Wonder of the Ancient World.',
            location: 'Giza, Egypt',
            duration: 150,
            price_usd: 32,
            rating: 4.8,
            total_purchases: 145,
            image_url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73702?w=800',
            category: 'Archaeology',
            difficulty: 'Intermediate',
            creator: { id: 'demo-4', full_name: 'Ahmed Hassan', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' }
          }
        ],
        nature: [
          {
            id: 'demo-guide-6',
            title: 'Viking Heritage Trail',
            description: 'Follow in the footsteps of Norse explorers and discover authentic Viking settlements and artifacts.',
            location: 'Bergen, Norway',
            duration: 180,
            price_usd: 30,
            rating: 4.7,
            total_purchases: 98,
            image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
            category: 'History',
            difficulty: 'Intermediate',
            creator: { id: 'demo-5', full_name: 'Sofia Andersson', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face' }
          }
        ],
        cultural: [
          {
            id: 'demo-guide-3',
            title: 'Zen Temples of Kyoto',
            description: 'Experience tranquility in Kyoto\'s most sacred temples while learning about Buddhist philosophy and Japanese spirituality.',
            location: 'Kyoto, Japan',
            duration: 180,
            price_usd: 28,
            rating: 4.9,
            total_purchases: 112,
            image_url: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800',
            category: 'Temples',
            difficulty: 'Beginner',
            creator: { id: 'demo-2', full_name: 'Kenji Tanaka', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' }
          }
        ],
        culinary: [
          {
            id: 'demo-guide-10',
            title: 'Spice Markets of Mumbai',
            description: 'Navigate the bustling spice markets and learn the secrets behind India\'s most aromatic treasures.',
            location: 'Mumbai, India',
            duration: 120,
            price_usd: 26,
            rating: 4.9,
            total_purchases: 189,
            image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
            category: 'Culinary',
            difficulty: 'Beginner',
            creator: { id: 'demo-6', full_name: 'Rajesh Patel', avatar_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face' }
          }
        ]
      };

      const demoExperiences = {
        museums: [
          {
            id: 'exp-1',
            title: 'Virtual Vatican Museums Tour',
            description: 'Take an exclusive virtual tour through the Vatican Museums with art historian Elena Rossi.',
            creator_id: 'demo-1',
            price_usd: 35,
            duration_minutes: 90,
            max_participants: 15,
            location: 'Vatican City (Virtual)',
            category: 'Museums',
            experience_type: 'virtual_tour',
            image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
            creator: { id: 'demo-1', full_name: 'Elena Rossi', avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face' }
          }
        ],
        cultural: [
          {
            id: 'exp-2',
            title: 'Japanese Tea Ceremony Experience',
            description: 'Learn the ancient art of Japanese tea ceremony in an authentic virtual setting.',
            creator_id: 'demo-2',
            price_usd: 28,
            duration_minutes: 75,
            max_participants: 8,
            location: 'Kyoto, Japan (Virtual)',
            category: 'Cultural',
            experience_type: 'cooking_class',
            image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800',
            creator: { id: 'demo-2', full_name: 'Kenji Tanaka', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' }
          }
        ],
        historical: [
          {
            id: 'exp-3',
            title: 'Machu Picchu Archaeological Deep Dive',
            description: 'Join Dr. Maria Garcia for an in-depth exploration of Machu Picchu\'s mysteries.',
            creator_id: 'demo-3',
            price_usd: 42,
            duration_minutes: 120,
            max_participants: 20,
            location: 'Machu Picchu, Peru (Virtual)',
            category: 'Archaeology',
            experience_type: 'educational',
            image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
            creator: { id: 'demo-3', full_name: 'Dr. Maria Garcia', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face' }
          }
        ]
      };

      const categoryGuides = demoGuides[categoryType as keyof typeof demoGuides] || [];
      const categoryExperiences = demoExperiences[categoryType as keyof typeof demoExperiences] || [];

      setGuides(categoryGuides);
      setExperiences(categoryExperiences);
    } catch (error) {
      console.error('Error fetching category content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load category content.",
      });
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
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              <span>4.8 average rating</span>
            </div>
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
                    creatorId={guide.creator.id}
                    creatorName={guide.creator.full_name}
                    creatorAvatar={guide.creator.avatar_url}
                    totalPurchases={guide.total_purchases}
                  />
                ))}
                {experiences.map((experience) => (
                  <LiveExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="guides" className="mt-6">
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
                    creatorId={guide.creator.id}
                    creatorName={guide.creator.full_name}
                    creatorAvatar={guide.creator.avatar_url}
                    totalPurchases={guide.total_purchases}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="experiences" className="mt-6">
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {experiences.map((experience) => (
                  <LiveExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!loading && guides.length === 0 && experiences.length === 0 && (
          <div className="text-center py-12">
            <IconComponent className={`h-16 w-16 mx-auto mb-4 ${currentCategory.textColor}`} />
            <h3 className="text-xl font-semibold mb-2">No content available yet</h3>
            <p className="text-muted-foreground mb-4">
              We're working on adding more {currentCategory.title.toLowerCase()} to this category.
            </p>
            <Button onClick={() => navigate('/')}>
              Explore Other Categories
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;