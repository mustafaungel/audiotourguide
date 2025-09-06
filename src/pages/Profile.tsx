import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import CreatorVerificationForm from '@/components/CreatorVerificationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Calendar, Shield, Star } from 'lucide-react';

const Profile = () => {
  const { user, userProfile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    switch (userProfile?.role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'content_creator':
        return <Badge className="bg-purple-100 text-purple-800"><Star className="w-3 h-3 mr-1" />Content Creator</Badge>;
      default:
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" />Traveler</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account information and creator status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={userProfile?.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {userProfile?.full_name || 'Anonymous User'}
                    </h2>
                    {getRoleBadge()}
                    {userProfile?.creator_badge && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Star className="w-3 h-3 mr-1" />Verified Creator
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{userProfile?.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  {userProfile?.bio && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {userProfile.bio}
                    </p>
                  )}
                </div>
              </div>

              {userProfile?.specialties && userProfile.specialties.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {userProfile?.social_profiles && Object.keys(userProfile.social_profiles).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Social Profiles</h3>
                  <div className="space-y-1">
                    {Object.entries(userProfile.social_profiles as Record<string, string>).map(([platform, url]) => (
                      <div key={platform} className="text-sm">
                        <span className="capitalize font-medium">{platform}:</span>{' '}
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creator Verification Section */}
          {userProfile?.role === 'traveler' && (
            <CreatorVerificationForm />
          )}

          {/* Creator Stats (if verified) */}
          {userProfile?.role === 'content_creator' && (
            <Card>
              <CardHeader>
                <CardTitle>Creator Statistics</CardTitle>
                <CardDescription>
                  Your content creation performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Guides Created</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;