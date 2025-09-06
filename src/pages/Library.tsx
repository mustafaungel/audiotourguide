import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Download, Search, Clock, MapPin, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Library() {
  const [purchasedGuides, setPurchasedGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPurchasedGuides();
    }
  }, [user]);

  const fetchPurchasedGuides = async () => {
    if (!user) return;

    try {
      const { data: purchases, error: purchaseError } = await supabase
        .from('user_purchases')
        .select(`
          *,
          audio_guides (*)
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (purchaseError) throw purchaseError;

      setPurchasedGuides(purchases || []);
    } catch (error) {
      console.error('Error fetching purchased guides:', error);
      toast({
        title: "Error",
        description: "Failed to load your library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = purchasedGuides.filter(purchase =>
    purchase.audio_guides?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.audio_guides?.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.audio_guides?.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">My Library</h1>
          <p className="text-muted-foreground mb-8">Please log in to view your purchased audio guides.</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Library</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your collection of purchased audio guides, ready for your next adventure
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur-sm border-border/50"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-40 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Library Content */}
        {!loading && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-primary mb-2">{purchasedGuides.length}</div>
                <div className="text-sm text-muted-foreground">Total Guides</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {Math.floor(purchasedGuides.reduce((total, purchase) => 
                    total + (purchase.audio_guides?.duration || 0), 0) / 60)}
                </div>
                <div className="text-sm text-muted-foreground">Minutes of Content</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  ${purchasedGuides.reduce((total, purchase) => 
                    total + (purchase.price_paid / 100), 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Invested</div>
              </Card>
            </div>

            {/* Guides Grid */}
            {filteredGuides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((purchase) => {
                  const guide = purchase.audio_guides;
                  if (!guide) return null;

                  return (
                    <Card key={purchase.id} className="overflow-hidden group hover:shadow-glow transition-all duration-300">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        {guide.image_url ? (
                          <img 
                            src={guide.image_url} 
                            alt={guide.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-hero flex items-center justify-center">
                            <div className="text-6xl opacity-20">🎧</div>
                          </div>
                        )}
                        
                        <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                          Purchased
                        </Badge>

                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button variant="hero" size="lg" className="rounded-full h-16 w-16">
                            <Play className="h-6 w-6 ml-1" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{guide.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">{guide.description}</p>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{Math.floor(guide.duration / 60)} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{guide.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-current text-yellow-400" />
                            <span>{guide.rating || 0}</span>
                          </div>
                        </div>

                        {/* Purchase Details */}
                        <div className="text-xs text-muted-foreground border-t border-border pt-3">
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
                          <Button className="flex-1">
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </Button>
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchTerm ? 'No guides found' : 'Your library is empty'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? 'Try searching with different keywords'
                    : 'Start building your collection of audio guides'
                  }
                </p>
                {!searchTerm && (
                  <Button asChild>
                    <Link to="/">Explore Guides</Link>
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}