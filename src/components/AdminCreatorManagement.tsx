import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Award, 
  MessageSquare,
  Settings,
  BarChart3,
  Crown,
  Edit,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TierBadge } from '@/components/TierBadge';
import { VerificationBadge } from '@/components/VerificationBadge';
import { useCreatorTier } from '@/hooks/useCreatorTier';

interface Creator {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  avatar_url: string;
  verification_status: string;
  specialties: string[];
  location: string;
  current_tier: string;
  tier_points: number;
  experience_years: number;
  languages_spoken: string[];
  social_profiles: any;
  verified_at: string;
  creator_badge: boolean;
  created_at: string;
  followers_count: number;
  total_guides: number;
  avg_rating: number;
  total_earnings: number;
  last_active: string;
}

export const AdminCreatorManagement = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { updateCreatorTier } = useCreatorTier();

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    filterCreators();
  }, [creators, searchQuery, statusFilter, tierFilter]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          email,
          full_name,
          bio,
          avatar_url,
          verification_status,
          specialties,
          guide_country,
          current_tier,
          tier_points,
          experience_years,
          languages_spoken,
          social_profiles,
          verified_at,
          creator_badge,
          created_at
        `)
        .eq('role', 'content_creator')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!profilesData) {
        setCreators([]);
        return;
      }

      // Calculate stats for each creator
      const creatorsWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          const stats = await calculateCreatorStats(profile.user_id);
          return {
            id: profile.user_id,
            email: profile.email,
            full_name: profile.full_name || 'Creator',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url,
            verification_status: profile.verification_status,
            specialties: profile.specialties || [],
            location: profile.guide_country || 'Global',
            current_tier: profile.current_tier || 'bronze',
            tier_points: profile.tier_points || 0,
            experience_years: profile.experience_years || 0,
            languages_spoken: profile.languages_spoken || [],
            social_profiles: profile.social_profiles || {},
            verified_at: profile.verified_at,
            creator_badge: profile.creator_badge,
            created_at: profile.created_at,
            last_active: profile.created_at, // Placeholder
            ...stats
          };
        })
      );

      setCreators(creatorsWithStats);
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error",
        description: "Failed to fetch creators.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCreatorStats = async (creatorId: string) => {
    try {
      // Get guides stats
      const { data: guidesData } = await supabase
        .from('audio_guides')
        .select('rating, total_purchases, total_reviews, price_usd')
        .eq('creator_id', creatorId)
        .eq('is_published', true);

      // Get followers count
      const { count: followersCount } = await supabase
        .from('creator_connections')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('is_active', true);

      // Get earnings
      const { data: earningsData } = await supabase
        .from('creator_earnings')
        .select('amount')
        .eq('creator_id', creatorId);

      const totalGuides = guidesData?.length || 0;
      const avgRating = totalGuides > 0 
        ? guidesData.reduce((sum, guide) => sum + (guide.rating || 0), 0) / totalGuides 
        : 0;
      const totalEarnings = earningsData?.reduce((sum, earning) => sum + earning.amount, 0) || 0;

      return {
        followers_count: followersCount || 0,
        total_guides: totalGuides,
        avg_rating: Math.round(avgRating * 10) / 10,
        total_earnings: totalEarnings
      };
    } catch (error) {
      console.error('Error calculating creator stats:', error);
      return {
        followers_count: 0,
        total_guides: 0,
        avg_rating: 0,
        total_earnings: 0
      };
    }
  };

  const filterCreators = () => {
    let filtered = [...creators];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(creator =>
        creator.full_name.toLowerCase().includes(query) ||
        creator.email.toLowerCase().includes(query) ||
        creator.bio.toLowerCase().includes(query) ||
        creator.specialties.some(specialty => specialty.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(creator => creator.verification_status === statusFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(creator => creator.current_tier === tierFilter);
    }

    setFilteredCreators(filtered);
  };

  const handleTierUpdate = async (creatorId: string) => {
    try {
      setActionLoading(creatorId);
      await updateCreatorTier(creatorId);
      await fetchCreators(); // Refresh data
      toast({
        title: "Success",
        description: "Creator tier updated successfully.",
      });
    } catch (error) {
      console.error('Error updating tier:', error);
      toast({
        title: "Error",
        description: "Failed to update creator tier.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerificationToggle = async (creatorId: string, newStatus: string) => {
    try {
      setActionLoading(creatorId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: newStatus,
          verified_at: newStatus === 'verified' ? new Date().toISOString() : null
        })
        .eq('user_id', creatorId);

      if (error) throw error;

      await fetchCreators();
      toast({
        title: "Success",
        description: `Creator ${newStatus} successfully.`,
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatorEdit = async (updatedCreator: Partial<Creator>) => {
    if (!selectedCreator) return;

    try {
      setActionLoading(selectedCreator.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedCreator.full_name,
          bio: updatedCreator.bio,
          specialties: updatedCreator.specialties,
          experience_years: updatedCreator.experience_years,
          languages_spoken: updatedCreator.languages_spoken
        })
        .eq('user_id', selectedCreator.id);

      if (error) throw error;

      await fetchCreators();
      setShowEditDialog(false);
      setSelectedCreator(null);
      
      toast({
        title: "Success",
        description: "Creator profile updated successfully.",
      });
    } catch (error) {
      console.error('Error updating creator:', error);
      toast({
        title: "Error",
        description: "Failed to update creator profile.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Creator Management</h2>
          <p className="text-muted-foreground">Manage all creators on the platform</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{creators.length} Total Creators</Badge>
          <Badge variant="secondary">
            {creators.filter(c => c.verification_status === 'verified').length} Verified
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators by name, email, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Creator Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Creator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <Card key={creator.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{creator.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{creator.email}</p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCreator(creator);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <TierBadge tier={creator.current_tier} size="sm" />
                {creator.verification_status === 'verified' && (
                  <VerificationBadge type="blue_tick" size="sm" showText={false} />
                )}
                {creator.creator_badge && (
                  <Badge variant="secondary" className="text-xs">Creator</Badge>
                )}
                <Badge 
                  variant={creator.verification_status === 'verified' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {creator.verification_status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Bio */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {creator.bio || 'No bio available'}
              </p>

              {/* Location & Languages */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {creator.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {creator.experience_years}y exp
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{creator.followers_count}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{creator.total_guides}</div>
                  <div className="text-xs text-muted-foreground">Guides</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">
                      {creator.avg_rating > 0 ? creator.avg_rating : '-'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(creator.total_earnings)}
                  </div>
                  <div className="text-xs text-muted-foreground">Earnings</div>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1">
                {creator.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {creator.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{creator.specialties.length - 3}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleTierUpdate(creator.id)}
                  disabled={actionLoading === creator.id}
                >
                  <Award className="h-4 w-4 mr-1" />
                  Update Tier
                </Button>
                
                {creator.verification_status === 'verified' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerificationToggle(creator.id, 'unverified')}
                    disabled={actionLoading === creator.id}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerificationToggle(creator.id, 'verified')}
                    disabled={actionLoading === creator.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Join Date */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Joined {formatDate(creator.created_at)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Creator Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Creator Profile</DialogTitle>
            <DialogDescription>
              Update creator information and settings
            </DialogDescription>
          </DialogHeader>
          
          {selectedCreator && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    defaultValue={selectedCreator.full_name}
                    onChange={(e) => setSelectedCreator({
                      ...selectedCreator,
                      full_name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="experience_years">Experience (Years)</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    defaultValue={selectedCreator.experience_years}
                    onChange={(e) => setSelectedCreator({
                      ...selectedCreator,
                      experience_years: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  defaultValue={selectedCreator.bio}
                  onChange={(e) => setSelectedCreator({
                    ...selectedCreator,
                    bio: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleCreatorEdit(selectedCreator)}
                  disabled={actionLoading === selectedCreator.id}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredCreators.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};