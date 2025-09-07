import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, UserPlus, Camera, Globe, Award, MapPin, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TextareaWithCounter } from '@/components/ui/character-counter';
import { CountrySelector } from '@/components/CountrySelector';

export const AdminCreatorCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    email: '',
    fullName: '',
    password: '',
    bio: '',
    avatarUrl: '',
    
    // Professional Info
    creatorType: 'local_guide' as 'local_guide' | 'travel_photographer' | 'cultural_expert' | 'adventure_guide' | 'food_specialist' | 'historian',
    experienceYears: 1,
    specialties: [] as string[],
    languagesSpoken: ['English'],
    
    // Location & Licensing
    guideCountry: '',
    licenseCountry: '',
    licenseType: '',
    licenseNumber: '',
    
    // Verification
    verificationStatus: 'verified' as 'verified' | 'pending' | 'unverified',
    creatorBadge: true,
    blueTickVerified: false,
    localGuideVerified: true,
    
    // Social & Certifications
    socialProfiles: {
      instagram: '',
      twitter: '',
      linkedin: '',
      website: ''
    },
    certifications: [] as Array<{ name: string; issuer: string; year: number }>,
    
    // Tier System
    currentTier: 'bronze' as 'bronze' | 'silver' | 'gold' | 'platinum',
    tierPoints: 100
  });

  const specialtyOptions = [
    'Historical Tours', 'Cultural Heritage', 'Art & Museums', 'Architecture',
    'Food & Culinary', 'Nature & Wildlife', 'Adventure Sports', 'Photography',
    'Religious Sites', 'Local Markets', 'Nightlife', 'Family-Friendly',
    'Luxury Travel', 'Budget Travel', 'Solo Travel', 'Group Tours'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialProfiles: { ...prev.socialProfiles, [platform]: value }
    }));
  };

  const addSpecialty = (specialty: string) => {
    if (!formData.specialties.includes(specialty)) {
      handleInputChange('specialties', [...formData.specialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    handleInputChange('specialties', formData.specialties.filter(s => s !== specialty));
  };

  const addCertification = () => {
    const newCert = { name: '', issuer: '', year: new Date().getFullYear() };
    handleInputChange('certifications', [...formData.certifications, newCert]);
  };

  const updateCertification = (index: number, field: string, value: any) => {
    const updated = [...formData.certifications];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('certifications', updated);
  };

  const removeCertification = (index: number) => {
    handleInputChange('certifications', formData.certifications.filter((_, i) => i !== index));
  };

  const fillSampleCreatorData = () => {
    setFormData({
      email: 'creator@example.com',
      fullName: 'Maria Rodriguez',
      password: 'CreatorPass123!',
      bio: 'Professional local guide with 8 years of experience showing travelers the hidden gems of Barcelona. Specialized in cultural heritage tours and food experiences.',
      avatarUrl: '',
      creatorType: 'local_guide',
      experienceYears: 8,
      specialties: ['Historical Tours', 'Food & Culinary', 'Cultural Heritage'],
      languagesSpoken: ['English', 'Spanish', 'Catalan', 'French'],
      guideCountry: 'Spain',
      licenseCountry: 'Spain',
      licenseType: 'Official Tour Guide License',
      licenseNumber: 'TG-BCN-2016-1234',
      verificationStatus: 'verified',
      creatorBadge: true,
      blueTickVerified: true,
      localGuideVerified: true,
      socialProfiles: {
        instagram: '@maria_barcelona_guide',
        twitter: '@mariabcnguide',
        linkedin: 'maria-rodriguez-guide',
        website: 'https://barcelonawithmaria.com'
      },
      certifications: [
        { name: 'Certified Tour Guide', issuer: 'Barcelona Tourism Board', year: 2016 },
        { name: 'Food Safety Certificate', issuer: 'Spanish Health Ministry', year: 2020 }
      ],
      currentTier: 'gold',
      tierPoints: 750
    });
  };

  const createCreator = async () => {
    if (!formData.email || !formData.fullName) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Email and full name are required."
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password || 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: formData.fullName
        }
      });

      if (authError) throw authError;

      // Create profile with all creator-specific fields
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: 'content_creator',
          bio: formData.bio,
          avatar_url: formData.avatarUrl || null,
          creator_type: formData.creatorType,
          experience_years: formData.experienceYears,
          specialties: formData.specialties,
          languages_spoken: formData.languagesSpoken,
          guide_country: formData.guideCountry,
          license_country: formData.licenseCountry || null,
          license_type: formData.licenseType || null,
          verification_status: formData.verificationStatus,
          creator_badge: formData.creatorBadge,
          blue_tick_verified: formData.blueTickVerified,
          local_guide_verified: formData.localGuideVerified,
          social_profiles: formData.socialProfiles,
          certifications: formData.certifications,
          current_tier: formData.currentTier,
          tier_points: formData.tierPoints,
          verified_at: formData.verificationStatus === 'verified' ? new Date().toISOString() : null
        });

      if (profileError) throw profileError;

      toast({
        title: "Creator Created Successfully!",
        description: `${formData.fullName} has been created as a ${formData.creatorType} with ${formData.verificationStatus} status.`
      });

      // Reset form
      setFormData({
        email: '',
        fullName: '',
        password: '',
        bio: '',
        avatarUrl: '',
        creatorType: 'local_guide',
        experienceYears: 1,
        specialties: [],
        languagesSpoken: ['English'],
        guideCountry: '',
        licenseCountry: '',
        licenseType: '',
        licenseNumber: '',
        verificationStatus: 'verified',
        creatorBadge: true,
        blueTickVerified: false,
        localGuideVerified: true,
        socialProfiles: {
          instagram: '',
          twitter: '',
          linkedin: '',
          website: ''
        },
        certifications: [],
        currentTier: 'bronze',
        tierPoints: 100
      });

    } catch (error) {
      console.error('Error creating creator:', error);
      toast({
        variant: "destructive",
        title: "Creator Creation Failed",
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Creator Management</h2>
          <p className="text-muted-foreground">Create comprehensive creator profiles with all necessary details</p>
        </div>
        <Button variant="outline" onClick={fillSampleCreatorData}>
          <Users className="h-4 w-4 mr-2" />
          Fill Sample Creator Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Creator
          </CardTitle>
          <CardDescription>
            Add a new content creator with complete profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="creator@example.com"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Maria Rodriguez"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Leave empty for auto-generated"
                />
              </div>
              <div>
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div>
              <TextareaWithCounter
                label="Bio *"
                maxLength={500}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Professional background, experience, and what makes you unique..."
                rows={4}
                helpText="Required bio describing your professional background"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Award className="h-4 w-4" />
              Professional Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creatorType">Creator Type</Label>
                <Select value={formData.creatorType} onValueChange={(value) => handleInputChange('creatorType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local_guide">Local Guide</SelectItem>
                    <SelectItem value="travel_photographer">Travel Photographer</SelectItem>
                    <SelectItem value="cultural_expert">Cultural Expert</SelectItem>
                    <SelectItem value="adventure_guide">Adventure Guide</SelectItem>
                    <SelectItem value="food_specialist">Food Specialist</SelectItem>
                    <SelectItem value="historian">Historian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 1)}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {formData.specialties.map((specialty, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeSpecialty(specialty)}
                  >
                    {specialty} ×
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Add specialties..." />
                </SelectTrigger>
                <SelectContent>
                  {specialtyOptions.filter(s => !formData.specialties.includes(s)).map(specialty => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Languages Spoken</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {formData.languagesSpoken.map((lang, index) => (
                  <Badge key={index} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add language and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim();
                    if (value && !formData.languagesSpoken.includes(value)) {
                      handleInputChange('languagesSpoken', [...formData.languagesSpoken, value]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Location & Licensing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Licensing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guideCountry">Guide Country</Label>
                <CountrySelector
                  value={formData.guideCountry}
                  onValueChange={(value) => handleInputChange('guideCountry', value)}
                  placeholder="Select guide country"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="licenseCountry">License Country</Label>
                <CountrySelector
                  value={formData.licenseCountry}
                  onValueChange={(value) => handleInputChange('licenseCountry', value)}
                  placeholder="Select license country"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseType">License Type</Label>
                <Input
                  id="licenseType"
                  value={formData.licenseType}
                  onChange={(e) => handleInputChange('licenseType', e.target.value)}
                  placeholder="Official Tour Guide License"
                />
              </div>
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder="TG-BCN-2016-1234"
                />
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Verification & Status
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <Select value={formData.verificationStatus} onValueChange={(value) => handleInputChange('verificationStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currentTier">Creator Tier</Label>
                <Select value={formData.currentTier} onValueChange={(value) => handleInputChange('currentTier', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.creatorBadge}
                  onCheckedChange={(checked) => handleInputChange('creatorBadge', checked)}
                />
                <Label>Creator Badge</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.blueTickVerified}
                  onCheckedChange={(checked) => handleInputChange('blueTickVerified', checked)}
                />
                <Label>Blue Tick Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.localGuideVerified}
                  onCheckedChange={(checked) => handleInputChange('localGuideVerified', checked)}
                />
                <Label>Local Guide Verified</Label>
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Social Profiles
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialProfiles.instagram}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={formData.socialProfiles.twitter}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.socialProfiles.linkedin}
                  onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.socialProfiles.website}
                  onChange={(e) => handleSocialChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Certifications</h3>
              <Button variant="outline" size="sm" onClick={addCertification}>
                Add Certification
              </Button>
            </div>
            
            {formData.certifications.map((cert, index) => (
              <div key={index} className="grid md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Certification Name</Label>
                  <Input
                    value={cert.name}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    placeholder="Certified Tour Guide"
                  />
                </div>
                <div>
                  <Label>Issuer</Label>
                  <Input
                    value={cert.issuer}
                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                    placeholder="Tourism Board"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={cert.year}
                    onChange={(e) => updateCertification(index, 'year', parseInt(e.target.value))}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeCertification(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={createCreator}
              disabled={isCreating || !formData.email || !formData.fullName}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Creator...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Creator
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};