import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, AlertTriangle, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DocumentUpload } from "./DocumentUpload";
import { VerificationBadge } from "./VerificationBadge";

interface EnhancedCreatorVerificationFormProps {
  userProfile: any;
}

export const EnhancedCreatorVerificationForm: React.FC<EnhancedCreatorVerificationFormProps> = ({ userProfile }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [creatorType, setCreatorType] = useState<'local_guide' | 'influencer' | 'hybrid'>('local_guide');
  const [fullName, setFullName] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experienceDescription, setExperienceDescription] = useState("");
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    website: ""
  });
  
  // Document URLs
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a verification request.",
        variant: "destructive",
      });
      return;
    }

    // Validation based on creator type
    if (creatorType === 'local_guide' && !licenseDocumentUrl) {
      toast({
        title: "License required",
        description: "Local guides must upload their tourism license.",
        variant: "destructive",
      });
      return;
    }

    if (creatorType === 'influencer' && !socialMediaLinks.instagram && !socialMediaLinks.youtube && !socialMediaLinks.tiktok) {
      toast({
        title: "Social media required",
        description: "Influencers must provide at least one social media profile.",
        variant: "destructive",
      });
      return;
    }

    if (!idDocumentUrl) {
      toast({
        title: "ID document required",
        description: "Please upload a valid ID document.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          creator_type: creatorType,
          full_name: fullName,
          portfolio_url: portfolioUrl,
          experience_description: experienceDescription,
          social_media_links: socialMediaLinks,
          id_document_url: idDocumentUrl,
          license_document_url: licenseDocumentUrl,
          id_number: idNumber,
          license_number: licenseNumber,
          status: 'pending',
          document_status: 'pending',
          verification_level: 'basic'
        });

      if (error) throw error;

      // Update user profile status
      await supabase
        .from('profiles')
        .update({ verification_status: 'pending' })
        .eq('user_id', user.id);

      toast({
        title: "Application submitted",
        description: "Your verification request has been submitted for review.",
      });

      // Reset form
      setFullName("");
      setPortfolioUrl("");
      setExperienceDescription("");
      setSocialMediaLinks({ instagram: "", twitter: "", youtube: "", tiktok: "", website: "" });
      setIdDocumentUrl("");
      setLicenseDocumentUrl("");
      setIdNumber("");
      setLicenseNumber("");
    } catch (error) {
      console.error('Error submitting verification request:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        );
    }
  };

  // Show status if user has already applied or is verified
  if (userProfile.verification_status === 'verified') {
    const badgeType = userProfile.local_guide_verified ? 'local_guide' : 
                     userProfile.blue_tick_verified ? 'blue_tick' : 'blue_tick';
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Verification Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <VerificationBadge type={badgeType} />
            {getStatusBadge('verified')}
          </div>
          <p className="text-sm text-muted-foreground">
            Your creator account has been verified. You now have access to all creator features and can start building your audience.
          </p>
          {userProfile.verified_at && (
            <p className="text-xs text-muted-foreground">
              Verified on {new Date(userProfile.verified_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (userProfile.verification_status === 'pending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span>Verification Under Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            {getStatusBadge('pending')}
          </div>
          <p className="text-sm text-muted-foreground">
            Your verification request is currently being reviewed by our team. This process typically takes 2-3 business days.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userProfile.verification_status === 'rejected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span>Verification Request Rejected</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            {getStatusBadge('rejected')}
          </div>
          <p className="text-sm text-muted-foreground">
            Your verification request was not approved. Please review the feedback below and submit a new application.
          </p>
          {userProfile.rejection_reason && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Reason:</strong> {userProfile.rejection_reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show the verification application form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Creator Verification</CardTitle>
        <p className="text-sm text-muted-foreground">
          Get verified to unlock premium features and build trust with your audience.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Creator Type Selection */}
          <div className="space-y-3">
            <Label>What type of creator are you?</Label>
            <Tabs value={creatorType} onValueChange={(value) => setCreatorType(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="local_guide" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Local Guide</span>
                </TabsTrigger>
                <TabsTrigger value="influencer" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Influencer</span>
                </TabsTrigger>
                <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
              </TabsList>
              
              <TabsContent value="local_guide" className="mt-4">
                <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-200">Local Guide Verification</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    Requires: Valid ID + Tourism/Guide License
                  </p>
                  <ul className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 space-y-1">
                    <li>• Access to creator dashboard</li>
                    <li>• "Verified Local Guide" badge</li>
                    <li>• Higher search ranking</li>
                    <li>• Revenue sharing opportunities</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="influencer" className="mt-4">
                <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200">Influencer Verification</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    Requires: Valid ID + Social Media Verification
                  </p>
                  <ul className="text-sm text-purple-600 dark:text-purple-400 mt-2 space-y-1">
                    <li>• Blue tick verification badge</li>
                    <li>• Social media integration</li>
                    <li>• Collaboration opportunities</li>
                    <li>• Enhanced profile features</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="hybrid" className="mt-4">
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Hybrid Creator</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Requires: All documents + social verification
                  </p>
                  <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1">
                    <li>• Both verification badges</li>
                    <li>• All creator benefits</li>
                    <li>• Premium support</li>
                    <li>• Exclusive opportunities</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full legal name"
                required
              />
            </div>

            <div>
              <Label htmlFor="portfolioUrl">Portfolio/Website URL</Label>
              <Input
                id="portfolioUrl"
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://your-website.com"
              />
            </div>

            <div>
              <Label htmlFor="experience">Experience & Expertise</Label>
              <Textarea
                id="experience"
                value={experienceDescription}
                onChange={(e) => setExperienceDescription(e.target.value)}
                placeholder="Describe your experience in tourism, content creation, or cultural expertise..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Document Verification</h3>
            
            <DocumentUpload
              label="Government ID"
              documentType="id"
              onUploadComplete={setIdDocumentUrl}
              currentUrl={idDocumentUrl}
              required
            />

            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                required
              />
            </div>

            {(creatorType === 'local_guide' || creatorType === 'hybrid') && (
              <>
                <DocumentUpload
                  label="Tourism/Guide License"
                  documentType="license"
                  onUploadComplete={setLicenseDocumentUrl}
                  currentUrl={licenseDocumentUrl}
                  required
                />

                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Enter your license number"
                    required={creatorType === 'local_guide' || creatorType === 'hybrid'}
                  />
                </div>
              </>
            )}
          </div>

          {/* Social Media Links */}
          {(creatorType === 'influencer' || creatorType === 'hybrid') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Media Verification</h3>
              <p className="text-sm text-muted-foreground">
                Provide at least one social media profile to verify your influence.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={socialMediaLinks.instagram}
                    onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    type="url"
                    value={socialMediaLinks.youtube}
                    onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, youtube: e.target.value }))}
                    placeholder="https://youtube.com/@channel"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    type="url"
                    value={socialMediaLinks.tiktok}
                    onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    type="url"
                    value={socialMediaLinks.twitter}
                    onChange={(e) => setSocialMediaLinks(prev => ({ ...prev, twitter: e.target.value }))}
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Submitting..." : "Submit Verification Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};