import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TextareaWithCounter, InputWithCounter } from '@/components/ui/character-counter';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditFormProps {
  profile: any;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface ProfileFormData {
  full_name: string;
  bio: string;
  specialties: string[];
  languages_spoken: string[];
  guide_country: string;
  experience_years: number;
}

const COMMON_SPECIALTIES = [
  'Historical Tours',
  'Cultural Experiences',
  'Food & Cuisine',
  'Art & Architecture',
  'Nature & Wildlife',
  'Photography',
  'Adventure Tourism',
  'Religious Sites',
  'Local Markets',
  'Street Art',
  'Nightlife',
  'Family-Friendly Tours'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Turkish', 'Greek', 'Swedish', 'Norwegian', 'Danish'
];

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onSubmit,
  isSubmitting = false
}) => {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialties || []);
  const [languages, setLanguages] = useState<string[]>(profile?.languages_spoken || ['English']);
  const [guideCountry, setGuideCountry] = useState(profile?.guide_country || '');
  const [experienceYears, setExperienceYears] = useState(profile?.experience_years?.toString() || '');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (fullName.length > 100) {
      toast({
        title: "Name too long",
        description: "Name must be 100 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (bio.length > 1000) {
      toast({
        title: "Bio too long",
        description: "Bio must be 1000 characters or less",
        variant: "destructive",
      });
      return;
    }

    const expYears = experienceYears ? parseInt(experienceYears) : 0;
    if (experienceYears && (isNaN(expYears) || expYears < 0 || expYears > 50)) {
      toast({
        title: "Invalid experience",
        description: "Experience must be between 0 and 50 years",
        variant: "destructive",
      });
      return;
    }

    const formData: ProfileFormData = {
      full_name: fullName.trim(),
      bio: bio.trim(),
      specialties,
      languages_spoken: languages,
      guide_country: guideCountry.trim(),
      experience_years: expYears
    };

    await onSubmit(formData);
  };

  const addSpecialty = (specialty: string) => {
    if (specialty && !specialties.includes(specialty)) {
      setSpecialties([...specialties, specialty]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const addLanguage = (language: string) => {
    if (language && !languages.includes(language)) {
      setLanguages([...languages, language]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    if (language !== 'English') { // Keep English as default
      setLanguages(languages.filter(l => l !== language));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <InputWithCounter
            maxLength={100}
            label="Full Name *"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            helpText="This will be displayed publicly"
            showProgress
          />

          {/* Bio */}
          <TextareaWithCounter
            maxLength={1000}
            label="Bio"
            placeholder="Tell travelers about yourself, your expertise, and what makes your guides special..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[120px]"
            helpText="Share your passion for travel and local knowledge"
            showProgress
          />

          {/* Guide Country */}
          <InputWithCounter
            maxLength={50}
            label="Primary Guide Location"
            placeholder="Country or region where you offer guides"
            value={guideCountry}
            onChange={(e) => setGuideCountry(e.target.value)}
            helpText="Where do you primarily guide travelers?"
          />

          {/* Experience Years */}
          <div>
            <label className="text-sm font-medium mb-2 block">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="50"
              placeholder="0"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many years have you been guiding or sharing local knowledge?
            </p>
          </div>

          {/* Specialties */}
          <div>
            <label className="text-sm font-medium mb-2 block">Specialties</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {COMMON_SPECIALTIES.filter(s => !specialties.includes(s)).map((specialty) => (
                  <Button
                    key={specialty}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSpecialty(specialty)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {specialty}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom specialty"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialty(newSpecialty);
                    }
                  }}
                  className="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSpecialty(newSpecialty)}
                  disabled={!newSpecialty.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="text-sm font-medium mb-2 block">Languages Spoken</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <Badge
                    key={language}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {language}
                    {language !== 'English' && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {LANGUAGES.filter(l => !languages.includes(l)).slice(0, 6).map((language) => (
                  <Button
                    key={language}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLanguage(language)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {language}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};