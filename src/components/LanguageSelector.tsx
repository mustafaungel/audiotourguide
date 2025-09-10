import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  variant: string;
  placeholder: string;
  maxSelections: number;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Turkish' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
];

export function LanguageSelector({ selectedLanguages, onLanguagesChange, placeholder }: LanguageSelectorProps) {
  const handleLanguageSelect = (languageCode: string) => {
    if (!selectedLanguages.includes(languageCode)) {
      onLanguagesChange([...selectedLanguages, languageCode]);
    }
  };

  return (
    <div className="space-y-2">
      <Select onValueChange={handleLanguageSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.filter(lang => !selectedLanguages.includes(lang.code)).map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}