import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Calendar, Heart, BookOpen, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  verification_status: string;
  specialties: string[];
  languages_spoken: string[];
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // First try to get real profile from database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('role', 'traveler')
        .single();

      if (error || !profileData) {
        // Fallback to demo user profiles
        const demoUsers = {
          'demo-alex': {
            id: 'demo-alex',
            full_name: 'Alex Thompson',
            bio: 'Travel enthusiast who loves discovering hidden gems and local cultures around the world. Always looking for authentic experiences and local guides.',
            avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face',
            verification_status: 'unverified',
            specialties: ['Cultural Tourism', 'Photography', 'Local Cuisine'],
            languages_spoken: ['English'],
            current_tier: 'bronze',
            tier_points: 120,
            created_at: '2024-05-01T00:00:00Z'
          },
          'demo-sarah': {
            id: 'demo-sarah',
            full_name: 'Sarah Williams',
            bio: 'Art lover and museum enthusiast. I enjoy guided tours that help me understand the deeper stories behind artworks and historical sites.',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            verification_status: 'unverified',
            specialties: ['Art', 'Museums', 'History'],
            languages_spoken: ['English', 'French'],
            current_tier: 'silver',
            tier_points: 280,
            created_at: '2024-01-01T00:00:00Z'
          },
          'demo-david': {
            id: 'demo-david',
            full_name: 'David Chen',
            bio: 'Digital nomad exploring the world one city at a time. Passionate about architecture, local food scenes, and connecting with local experts.',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            verification_status: 'unverified',
            specialties: ['Architecture', 'Food Tourism', 'Urban Exploration'],
            languages_spoken: ['English', 'Mandarin'],
            current_tier: 'silver',
            tier_points: 340,
            created_at: '2024-07-01T00:00:00Z'
          }
        };

        const demoUser = demoUsers[userId as keyof typeof demoUsers];
        if (demoUser) {
          const { current_tier, tier_points, ...userWithoutTier } = demoUser;
          setProfile(userWithoutTier);
        } else {
          // User not found
          setProfile(null);
        }
      } else {
        // Map database profile to our interface
        setProfile({
          id: profileData.id,
          full_name: profileData.full_name || 'Anonymous User',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || '',
          verification_status: profileData.verification_status || 'unverified',
          specialties: profileData.specialties || [],
          languages_spoken: profileData.languages_spoken || [],
          created_at: profileData.created_at
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This user profile doesn't exist or is no longer available.
          </p>
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                    <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                    {profile.verification_status === 'verified' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {profile.bio}
                  </p>

                  <div className="flex flex-col md:flex-row gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {memberSince}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About {profile.full_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages_spoken.map((language, index) => (
                        <Badge key={index} variant="secondary">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.specialties.map((interest, index) => (
                        <Badge key={index} variant="outline">
                          <Heart className="h-3 w-3 mr-1" />
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Traveler Status</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Traveler</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity to display</p>
                    <p className="text-sm">Activity will appear here as {profile.full_name} uses the platform</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements yet</p>
                    <p className="text-sm">Achievements will be earned as {profile.full_name} explores more guides</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;