import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Globe, Eye, EyeOff, MapPin, Languages, Award, FileText } from 'lucide-react';

interface PrivacySettings {
  show_social_media: boolean;
  show_experience_years: boolean;
  show_certifications: boolean;
  show_languages: boolean;
  show_guide_country: boolean;
  show_license_info: boolean;
  allow_public_messaging: boolean;
}

interface ProfessionalInfo {
  guide_country?: string;
  license_country?: string;
  license_type?: string;
  languages_spoken: string[];
  certifications: Record<string, any>;
  experience_years?: number;
}

export const CreatorPrivacySettings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    show_social_media: false,
    show_experience_years: true,
    show_certifications: true,
    show_languages: true,
    show_guide_country: true,
    show_license_info: true,
    allow_public_messaging: true,
  });
  const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInfo>({
    languages_spoken: [],
    certifications: {},
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchProfessionalInfo();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPrivacySettings({
          show_social_media: data.show_social_media,
          show_experience_years: data.show_experience_years,
          show_certifications: data.show_certifications,
          show_languages: data.show_languages,
          show_guide_country: data.show_guide_country,
          show_license_info: data.show_license_info,
          allow_public_messaging: data.allow_public_messaging,
        });
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionalInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('guide_country, license_country, license_type, languages_spoken, certifications, experience_years')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setProfessionalInfo({
        guide_country: data.guide_country || '',
        license_country: data.license_country || '',
        license_type: data.license_type || '',
        languages_spoken: data.languages_spoken || [],
        certifications: (data.certifications as Record<string, any>) || {},
        experience_years: data.experience_years || undefined,
      });
    } catch (error) {
      console.error('Error fetching professional info:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_privacy_settings')
        .upsert({
          user_id: user?.id,
          ...privacySettings,
        });

      if (error) throw error;

      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const saveProfessionalInfo = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          guide_country: professionalInfo.guide_country,
          license_country: professionalInfo.license_country,
          license_type: professionalInfo.license_type,
          languages_spoken: professionalInfo.languages_spoken,
          certifications: professionalInfo.certifications,
          experience_years: professionalInfo.experience_years,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Professional information updated');
    } catch (error) {
      console.error('Error saving professional info:', error);
      toast.error('Failed to save professional information');
    } finally {
      setSaving(false);
    }
  };

  const updatePrivacySetting = (key: keyof PrivacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const addLanguage = (language: string) => {
    if (language && !professionalInfo.languages_spoken.includes(language)) {
      setProfessionalInfo(prev => ({
        ...prev,
        languages_spoken: [...prev.languages_spoken, language],
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setProfessionalInfo(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.filter(lang => lang !== language),
    }));
  };

  if (!user || userProfile?.role !== 'content_creator') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Only content creators can access privacy settings.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Show Social Media Links
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to see your social media profiles
                </p>
              </div>
              <Switch
                checked={privacySettings.show_social_media}
                onCheckedChange={(checked) => updatePrivacySetting('show_social_media', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Show Experience Years
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your years of experience
                </p>
              </div>
              <Switch
                checked={privacySettings.show_experience_years}
                onCheckedChange={(checked) => updatePrivacySetting('show_experience_years', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Show Certifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your professional certifications
                </p>
              </div>
              <Switch
                checked={privacySettings.show_certifications}
                onCheckedChange={(checked) => updatePrivacySetting('show_certifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Show Languages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display languages you can guide in
                </p>
              </div>
              <Switch
                checked={privacySettings.show_languages}
                onCheckedChange={(checked) => updatePrivacySetting('show_languages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Show Guide Country
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your operating country/region
                </p>
              </div>
              <Switch
                checked={privacySettings.show_guide_country}
                onCheckedChange={(checked) => updatePrivacySetting('show_guide_country', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Show License Information
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your professional license status
                </p>
              </div>
              <Switch
                checked={privacySettings.show_license_info}
                onCheckedChange={(checked) => updatePrivacySetting('show_license_info', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Allow Public Messaging
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to send you messages
                </p>
              </div>
              <Switch
                checked={privacySettings.allow_public_messaging}
                onCheckedChange={(checked) => updatePrivacySetting('allow_public_messaging', checked)}
              />
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guide-country">Guide Operating Country</Label>
              <Input
                id="guide-country"
                value={professionalInfo.guide_country || ''}
                onChange={(e) => setProfessionalInfo(prev => ({ ...prev, guide_country: e.target.value }))}
                placeholder="e.g., Turkey"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-country">License Country</Label>
              <Input
                id="license-country"
                value={professionalInfo.license_country || ''}
                onChange={(e) => setProfessionalInfo(prev => ({ ...prev, license_country: e.target.value }))}
                placeholder="e.g., Turkey"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-type">License Type</Label>
              <Input
                id="license-type"
                value={professionalInfo.license_type || ''}
                onChange={(e) => setProfessionalInfo(prev => ({ ...prev, license_type: e.target.value }))}
                placeholder="e.g., Professional Tourist Guide"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience-years">Years of Experience</Label>
              <Input
                id="experience-years"
                type="number"
                value={professionalInfo.experience_years || ''}
                onChange={(e) => setProfessionalInfo(prev => ({ ...prev, experience_years: parseInt(e.target.value) || undefined }))}
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-language">Languages</Label>
            <div className="flex gap-2">
              <Input
                id="add-language"
                placeholder="Add a language"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addLanguage(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.getElementById('add-language') as HTMLInputElement;
                  if (input.value) {
                    addLanguage(input.value);
                    input.value = '';
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {professionalInfo.languages_spoken.map((language) => (
                <Badge
                  key={language}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeLanguage(language)}
                >
                  {language} ×
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={saveProfessionalInfo} disabled={saving}>
            {saving ? 'Saving...' : 'Save Professional Info'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};