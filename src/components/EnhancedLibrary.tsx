import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Download, 
  Search, 
  Clock, 
  MapPin, 
  Star, 
  BarChart3,
  Bookmark,
  Heart,
  Share2,
  Filter,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { LibraryAudioPlayer } from './LibraryAudioPlayer';
import { SocialShare } from './SocialShare';

interface PurchasedGuide {
  id: string;
  guide_id: string;
  access_code: string;
  purchase_date: string;
  price_paid: number;
  listening_progress?: number;
  last_played?: string;
  is_favorited?: boolean;
  audio_guides: {
    id: string;
    title: string;
    description: string;
    location: string;
    category: string;
    duration: number;
    rating: number;
    image_url?: string;
    audio_url?: string;
    transcript?: string;
  };
}

interface LibraryStats {
  totalGuides: number;
  totalListeningTime: number;
  completionRate: number;
  favoriteGenre: string;
  monthlyProgress: number;
}

interface EnhancedLibraryProps {
  guides: PurchasedGuide[];
  onPlayGuide: (guide: PurchasedGuide) => void;
  onDownloadGuide?: (guide: PurchasedGuide) => void;
}

export const EnhancedLibrary: React.FC<EnhancedLibraryProps> = ({
  guides,
  onPlayGuide,
  onDownloadGuide
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Calculate library statistics
  const stats: LibraryStats = {
    totalGuides: guides.length,
    totalListeningTime: guides.reduce((total, guide) => 
      total + (guide.audio_guides?.duration || 0), 0),
    completionRate: guides.filter(guide => 
      (guide.listening_progress || 0) > 80).length / guides.length * 100 || 0,
    favoriteGenre: getMostFrequentCategory(guides),
    monthlyProgress: getMonthlyProgress(guides)
  };

  function getMostFrequentCategory(guides: PurchasedGuide[]): string {
    const categories = guides.map(g => g.audio_guides?.category).filter(Boolean);
    const frequency = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(frequency).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
  }

  function getMonthlyProgress(guides: PurchasedGuide[]): number {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    return guides.filter(guide => {
      const purchaseDate = new Date(guide.purchase_date);
      return purchaseDate.getMonth() === thisMonth && 
             purchaseDate.getFullYear() === thisYear;
    }).length;
  }

  // Filter and sort guides
  const filteredGuides = guides
    .filter(guide => {
      const matchesSearch = 
        guide.audio_guides?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.audio_guides?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guide.audio_guides?.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'favorites' && guide.is_favorited) ||
        (filterBy === 'completed' && (guide.listening_progress || 0) > 80) ||
        (filterBy === 'in-progress' && (guide.listening_progress || 0) > 0 && (guide.listening_progress || 0) <= 80) ||
        (filterBy === 'unplayed' && !guide.listening_progress);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
        case 'alphabetical':
          return a.audio_guides?.title.localeCompare(b.audio_guides?.title || '') || 0;
        case 'rating':
          return (b.audio_guides?.rating || 0) - (a.audio_guides?.rating || 0);
        case 'duration':
          return (b.audio_guides?.duration || 0) - (a.audio_guides?.duration || 0);
        case 'progress':
          return (b.listening_progress || 0) - (a.listening_progress || 0);
        default:
          return 0;
      }
    });

  const handlePlayGuide = (guide: PurchasedGuide) => {
    setCurrentlyPlaying(guide.id);
    setShowPlayer(true);
    onPlayGuide(guide);
  };

  return (
    <div className="space-y-6">
      {/* Library Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guides</p>
                <p className="text-2xl font-bold">{stats.totalGuides}</p>
              </div>
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Listening Time</p>
                <p className="text-2xl font-bold">
                  {Math.floor(stats.totalListeningTime / 60)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.monthlyProgress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your library..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Guides</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="unplayed">Unplayed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Library Content */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((purchase) => {
              const guide = purchase.audio_guides;
              if (!guide) return null;

              const progress = purchase.listening_progress || 0;

              return (
                <Card key={purchase.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {guide.image_url ? (
                      <img 
                        src={guide.image_url} 
                        alt={guide.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <div className="text-6xl opacity-20">🎧</div>
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-green-600 text-white">
                        Purchased
                      </Badge>
                      {purchase.is_favorited && (
                        <Badge variant="secondary">
                          <Heart className="h-3 w-3 mr-1 fill-current" />
                          Favorite
                        </Badge>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        className="rounded-full h-16 w-16"
                        onClick={() => handlePlayGuide(purchase)}
                      >
                        <Play className="h-6 w-6 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{guide.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{guide.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{Math.floor(guide.duration / 60)} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-yellow-400" />
                          <span>{guide.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Info */}
                    {progress > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span>Progress: {progress}%</span>
                          {progress >= 100 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Award className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <span>{Math.floor((guide.duration * progress) / 100 / 60)} min listened</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Purchase Info */}
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <div className="flex justify-between">
                        <span>Purchased:</span>
                        <span>{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Access Code:</span>
                        <code className="text-primary">{purchase.access_code}</code>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => onPlayGuide(purchase)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {progress > 0 ? 'Continue' : 'Play'}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className={`h-4 w-4 ${purchase.is_favorited ? 'fill-current text-red-500' : ''}`} />
                      </Button>
                      <div>
                        <SocialShare
                          title={guide.title}
                          description={guide.description || `Explore ${guide.location} with this amazing audio guide`}
                          guide={{
                            id: guide.id,
                            title: guide.title,
                            location: guide.location,
                            image_url: guide.image_url
                          }}
                        />
                      </div>
                      {onDownloadGuide && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => onDownloadGuide(purchase)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredGuides.map((purchase) => {
                  const guide = purchase.audio_guides;
                  if (!guide) return null;

                  const progress = purchase.listening_progress || 0;

                  return (
                    <div 
                      key={purchase.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {guide.image_url ? (
                          <img 
                            src={guide.image_url} 
                            alt={guide.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            🎧
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{guide.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{guide.location}</span>
                          <span>{Math.floor(guide.duration / 60)} min</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-400" />
                            <span>{guide.rating}</span>
                          </div>
                        </div>
                        {progress > 0 && (
                          <div className="mt-1">
                            <Progress value={progress} className="h-1 w-32" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handlePlayGuide(purchase)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {progress > 0 ? 'Continue' : 'Play'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Heart className={`h-4 w-4 ${purchase.is_favorited ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Listening Habits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Completion Rate</span>
                      <span className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={stats.completionRate} />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Favorite Genre</h4>
                    <Badge variant="secondary">{stats.favoriteGenre}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">This Month</h4>
                    <p className="text-2xl font-bold text-primary">{stats.monthlyProgress}</p>
                    <p className="text-sm text-muted-foreground">Guides added</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{guides.filter(g => (g.listening_progress || 0) >= 100).length}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{guides.filter(g => (g.listening_progress || 0) > 0 && (g.listening_progress || 0) < 100).length}</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{guides.filter(g => g.is_favorited).length}</p>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredGuides.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No guides found' : 'Your library is empty'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search or filter criteria'
                : 'Start building your collection of audio guides'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Audio Player */}
      {showPlayer && currentlyPlaying && (
        <LibraryAudioPlayer
          guide={{
            id: filteredGuides.find(g => g.id === currentlyPlaying)?.audio_guides?.id || '',
            title: filteredGuides.find(g => g.id === currentlyPlaying)?.audio_guides?.title || '',
            audio_url: filteredGuides.find(g => g.id === currentlyPlaying)?.audio_guides?.audio_url
          }}
          accessCode={filteredGuides.find(g => g.id === currentlyPlaying)?.access_code}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};