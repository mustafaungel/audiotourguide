import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSelector } from './LanguageSelector';
import { Languages, Save, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const LanguagePreferences: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userProfile?.languages_spoken) {
      setSelectedLanguages(userProfile.languages_spoken);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile?.user_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          languages_spoken: selectedLanguages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast.success('Language preferences updated successfully');
    } catch (error) {
      console.error('Error updating language preferences:', error);
      toast.error('Failed to update language preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedLanguages(userProfile?.languages_spoken || []);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Language Preferences
        </CardTitle>
        <CardDescription>
          Select the languages you speak to get better matched with creators and content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <div className="space-y-4">
            {selectedLanguages.length > 0 ? (
              <div>
                <div className="text-sm font-medium mb-3">Your Languages</div>
                <div className="flex flex-wrap gap-2">
                  {selectedLanguages.map((language) => (
                    <Badge 
                      key={language} 
                      className="bg-tourism-earth/10 text-tourism-earth border-tourism-earth/20"
                    >
                      <Languages className="w-3 h-3 mr-1" />
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Languages className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No languages selected yet</p>
                <p className="text-xs mt-1">Add your spoken languages to enhance your experience</p>
              </div>
            )}
            
            <div className="flex justify-start">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {selectedLanguages.length > 0 ? 'Update Languages' : 'Add Languages'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onLanguagesChange={setSelectedLanguages}
              variant="preference"
              placeholder="Select your spoken languages..."
              maxSelections={15}
            />
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Languages'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {selectedLanguages.length > 0 && (
          <div className="bg-tourism-earth/5 border border-tourism-earth/10 rounded-lg p-4">
            <div className="text-sm font-medium text-tourism-earth mb-2">Benefits of Language Preferences</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Get matched with creators who speak your languages</li>
              <li>• See content recommendations in your preferred languages</li>
              <li>• Connect with travelers who share your language interests</li>
              <li>• Enhanced filtering options in search and discovery</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};