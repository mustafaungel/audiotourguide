import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, UserPlus, Mail, Shield, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TextareaWithCounter } from '@/components/ui/character-counter';
import { MultiSelect } from '@/components/ui/multi-select';
import { CountrySelector } from '@/components/CountrySelector';
import { LANGUAGES, COUNTRIES } from '@/data/constants';

export const AdminUserCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'traveler' as 'traveler' | 'content_creator' | 'admin',
    password: '',
    bio: '',
    languages: ['English'],
    guideCountry: '',
    sendInvite: true
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fillSampleData = () => {
    setFormData({
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'traveler',
      password: 'TempPass123!',
      bio: 'Sample bio for testing purposes',
      languages: ['English', 'Spanish'],
      guideCountry: 'United States',
      sendInvite: false
    });
  };

  const createUser = async () => {
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

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
          bio: formData.bio || null,
          languages_spoken: formData.languages,
          guide_country: formData.guideCountry || null,
          verification_status: formData.role === 'content_creator' ? 'pending' : 'unverified'
        });

      if (profileError) throw profileError;

      toast({
        title: "User Created Successfully!",
        description: `${formData.fullName} has been created with role: ${formData.role}`
      });

      // Reset form
      setFormData({
        email: '',
        fullName: '',
        role: 'traveler',
        password: '',
        bio: '',
        languages: ['English'],
        guideCountry: '',
        sendInvite: true
      });

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "User Creation Failed",
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
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Create and manage platform users</p>
        </div>
        <Button variant="outline" onClick={fillSampleData}>
          <UserCheck className="h-4 w-4 mr-2" />
          Fill Sample Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </CardTitle>
          <CardDescription>
            Add a new user to the platform with specified role and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
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
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">User Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traveler">Traveler</SelectItem>
                    <SelectItem value="content_creator">Content Creator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Profile Information
            </h3>
            
            <div>
              <TextareaWithCounter
                label="Bio"
                maxLength={500}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                helpText="Optional bio to introduce yourself"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="languages">Languages Spoken</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages.map((lang, index) => (
                    <Badge key={index} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  placeholder="Add language and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !formData.languages.includes(value)) {
                        handleInputChange('languages', [...formData.languages, value]);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="guideCountry">Guide Country</Label>
                <CountrySelector
                  value={formData.guideCountry}
                  onValueChange={(value) => handleInputChange('guideCountry', value)}
                  placeholder="Select country"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          {formData.role === 'content_creator' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Content Creator Note</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This user will be created with "pending" verification status and will need to complete the verification process to become an active content creator.
              </p>
            </div>
          )}

          {formData.role === 'admin' && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Admin Role Warning</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                This user will have full administrative privileges including user management, content moderation, and system configuration access.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              onClick={createUser}
              disabled={isCreating || !formData.email || !formData.fullName}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setFormData({
                email: '',
                fullName: '',
                role: 'traveler',
                password: '',
                bio: '',
                languages: ['English'],
                guideCountry: '',
                sendInvite: true
              })}
            >
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};