import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, XCircle, Upload, Camera, Globe, Instagram, Youtube } from 'lucide-react';

const CreatorVerificationForm = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile?.full_name || '',
    portfolioUrl: '',
    experienceDescription: '',
    socialMediaLinks: {
      instagram: '',
      youtube: '',
      website: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userProfile?.user_id,
          full_name: formData.fullName,
          portfolio_url: formData.portfolioUrl,
          experience_description: formData.experienceDescription,
          social_media_links: formData.socialMediaLinks
        });

      if (error) throw error;

      // Update profile status to pending
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('user_id', userProfile?.user_id);

      if (profileError) throw profileError;

      await refreshProfile();
      
      toast({
        title: "Verification Request Submitted",
        description: "Your request has been submitted for admin review."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (userProfile?.verification_status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified Creator</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  if (userProfile?.verification_status === 'verified') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Verified Content Creator
          </CardTitle>
          <CardDescription>
            You are a verified content creator and can create audio guides.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {getStatusBadge()}
            {userProfile.creator_badge && (
              <Badge className="bg-blue-100 text-blue-800">
                <Camera className="w-3 h-3 mr-1" />Creator Badge
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Verified on: {userProfile.verified_at ? new Date(userProfile.verified_at).toLocaleDateString() : 'N/A'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userProfile?.verification_status === 'pending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Pending</CardTitle>
          <CardDescription>
            Your verification request is under review by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getStatusBadge()}
        </CardContent>
      </Card>
    );
  }

  if (userProfile?.verification_status === 'rejected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Verification Rejected</CardTitle>
          <CardDescription>
            Your verification request was rejected. Please contact support for more information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">{getStatusBadge()}</div>
          {userProfile.rejection_reason && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <strong>Reason:</strong> {userProfile.rejection_reason}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Become a Verified Content Creator</CardTitle>
        <CardDescription>
          Apply to become a verified content creator to start creating and selling audio guides.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio/Website URL</Label>
            <Input
              id="portfolioUrl"
              type="url"
              placeholder="https://your-portfolio.com"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Experience & Qualifications</Label>
            <Textarea
              id="experience"
              placeholder="Tell us about your experience as a tour guide, travel expert, or content creator..."
              value={formData.experienceDescription}
              onChange={(e) => setFormData({ ...formData, experienceDescription: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Social Media Profiles (Optional)</Label>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Website URL"
                  value={formData.socialMediaLinks.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMediaLinks: { ...formData.socialMediaLinks, website: e.target.value }
                  })}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Instagram handle"
                  value={formData.socialMediaLinks.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMediaLinks: { ...formData.socialMediaLinks, instagram: e.target.value }
                  })}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="YouTube channel"
                  value={formData.socialMediaLinks.youtube}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMediaLinks: { ...formData.socialMediaLinks, youtube: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : 'Submit Verification Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatorVerificationForm;