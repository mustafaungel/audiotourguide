import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/TierBadge';
import { VerificationBadge } from '@/components/VerificationBadge';
import { LanguagePreferences } from '@/components/LanguagePreferences';
import { TextareaWithCounter } from '@/components/ui/character-counter';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Star, 
  MapPin, 
  Languages, 
  Award, 
  Globe, 
  Users,
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react';

interface EnhancedProfileProps {
  showAdminFeatures?: boolean;
}

export const EnhancedProfile: React.FC<EnhancedProfileProps> = ({ 
  showAdminFeatures = false 
}) => {
  const { user, userProfile } = useAuth();

  if (!user || !userProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = () => {
    switch (userProfile?.role) {
      case 'admin':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'content_creator':
        return (
          <Badge className="bg-tourism-warm/10 text-tourism-warm border-tourism-warm/20">
            <Star className="w-3 h-3 mr-1" />
            Content Creator
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="w-3 h-3 mr-1" />
            Traveler
          </Badge>
        );
    }
  };

  const renderAdminProfile = () => (
    <div className="space-y-6">
      {/* Admin Overview */}
      <Card className="bg-gradient-card border-tourism-warm/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Admin Dashboard Overview
          </CardTitle>
          <CardDescription>System administration and platform oversight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-warm">1,247</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-accent">89</div>
              <div className="text-sm text-muted-foreground">Active Creators</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-earth">342</div>
              <div className="text-sm text-muted-foreground">Published Guides</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-sunset">23</div>
              <div className="text-sm text-muted-foreground">Pending Reviews</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span>Content Moderation</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <TrendingUp className="w-6 h-6" />
              <span>Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreatorProfile = () => (
    <div className="space-y-6">
      {/* Creator Stats */}
      <Card className="bg-gradient-card border-tourism-warm/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-tourism-warm" />
            Creator Performance
          </CardTitle>
          <CardDescription>Your content creation statistics and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-warm">12</div>
              <div className="text-sm text-muted-foreground">Published Guides</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-accent">4.8</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-earth">2,341</div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-sunset">$1,240</div>
              <div className="text-sm text-muted-foreground">Monthly Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Progress */}
      {userProfile.current_tier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Creator Tier Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <TierBadge tier={userProfile.current_tier} size="lg" showIcon />
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tier Points</div>
                <div className="text-xl font-bold">{userProfile.tier_points || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creator Expertise */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userProfile.experience_years && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{userProfile.experience_years} years of experience</span>
            </div>
          )}
          
          {userProfile.license_type && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{userProfile.license_type} - {userProfile.license_country}</span>
            </div>
          )}

          {userProfile.guide_country && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Licensed guide in {userProfile.guide_country}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTravelerProfile = () => (
    <div className="space-y-6">
      {/* Travel Stats */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            Travel Journey
          </CardTitle>
          <CardDescription>Your adventure statistics and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-accent">7</div>
              <div className="text-sm text-muted-foreground">Guides Purchased</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-earth">15</div>
              <div className="text-sm text-muted-foreground">Countries Explored</div>
            </div>
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-sunset">42</div>
              <div className="text-sm text-muted-foreground">Reviews Written</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Preferences */}
      <LanguagePreferences />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="bg-gradient-hero border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24 ring-2 ring-tourism-warm/20">
              <AvatarImage src={userProfile?.avatar_url || ''} />
              <AvatarFallback className="text-xl bg-tourism-warm/10 text-tourism-warm">
                {userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {userProfile?.full_name || 'Anonymous User'}
                </h1>
                {getRoleBadge()}
                {userProfile?.verification_status === 'verified' && (
                  <VerificationBadge 
                    type={userProfile?.local_guide_verified ? 'local_guide' : 
                          userProfile?.blue_tick_verified ? 'blue_tick' : 'blue_tick'} 
                    size="sm"
                  />
                )}
                {userProfile?.current_tier && (
                  <TierBadge tier={userProfile.current_tier} size="sm" showIcon />
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{userProfile?.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {userProfile?.guide_country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{userProfile.guide_country}</span>
                  </div>
                )}
              </div>

              {userProfile?.bio && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {userProfile.bio}
                </p>
              )}

              {/* Specialties */}
              {userProfile?.specialties && userProfile.specialties.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Specialties</div>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-tourism-warm/10 text-tourism-warm">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {userProfile?.languages_spoken && userProfile.languages_spoken.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Languages className="w-4 h-4" />
                    Languages
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.languages_spoken.map((language, index) => (
                      <Badge key={index} variant="outline">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Profiles */}
              {userProfile?.social_profiles && Object.keys(userProfile.social_profiles).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Social Profiles
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(userProfile.social_profiles as Record<string, string>).map(([platform, url]) => (
                      <Button key={platform} variant="outline" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Content */}
      {userProfile?.role === 'admin' && renderAdminProfile()}
      {userProfile?.role === 'content_creator' && renderCreatorProfile()}
      {userProfile?.role === 'traveler' && renderTravelerProfile()}
    </div>
  );
};