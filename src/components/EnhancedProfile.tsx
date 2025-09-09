import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguagePreferences } from '@/components/LanguagePreferences';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Star, 
  MapPin, 
  Languages, 
  Globe,
  TrendingUp,
  FileText
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
    // Simplified role system - only admin and user
    if (userProfile?.email?.includes('admin') || userProfile?.full_name?.toLowerCase().includes('admin')) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
    }
    return <Badge variant="outline" className="flex items-center gap-1"><User className="h-3 w-3" />User</Badge>;
  };

  const renderAdminProfile = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-tourism-warm/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Admin Dashboard Overview
          </CardTitle>
          <CardDescription>System administration and platform oversight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-tourism-warm">1,247</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
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
    </div>
  );

  const renderTravelerProfile = () => (
    <div className="space-y-6">
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
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{userProfile?.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date(userProfile?.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Content */}
      {(userProfile?.email?.includes('admin') || userProfile?.full_name?.toLowerCase().includes('admin')) && renderAdminProfile()}
      {!(userProfile?.email?.includes('admin') || userProfile?.full_name?.toLowerCase().includes('admin')) && renderTravelerProfile()}
    </div>
  );
};