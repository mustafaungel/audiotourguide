import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, Languages, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVAILABLE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish',
  'Norwegian', 'Danish', 'Greek', 'Turkish', 'Polish', 'Czech', 'Hungarian',
  'Croatian', 'Bulgarian', 'Romanian', 'Finnish', 'Estonian', 'Latvian',
  'Lithuanian', 'Slovenian', 'Slovak', 'Ukrainian', 'Hebrew', 'Thai',
  'Vietnamese', 'Indonesian', 'Malay', 'Tagalog', 'Swahili'
];

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
  variant?: 'filter' | 'preference';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onLanguagesChange,
  maxSelections = 10,
  placeholder = "Select languages...",
  variant = 'filter',
  className
}) => {
  const [open, setOpen] = React.useState(false);

  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      onLanguagesChange(selectedLanguages.filter(l => l !== language));
    } else if (selectedLanguages.length < maxSelections) {
      onLanguagesChange([...selectedLanguages, language]);
    }
  };

  const removeLanguage = (language: string) => {
    onLanguagesChange(selectedLanguages.filter(l => l !== language));
  };

  const isFilterVariant = variant === 'filter';

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between font-normal",
              isFilterVariant ? "h-9" : "h-10"
            )}
          >
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {selectedLanguages.length > 0 
                  ? `${selectedLanguages.length} selected`
                  : placeholder
                }
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search languages..." />
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {AVAILABLE_LANGUAGES.map((language) => (
                <CommandItem
                  key={language}
                  onSelect={() => handleLanguageToggle(language)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedLanguages.includes(language) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {language}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Languages Display */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLanguages.map((language) => (
            <Badge 
              key={language} 
              variant="secondary" 
              className={cn(
                "bg-tourism-earth/10 text-tourism-earth border-tourism-earth/20 hover:bg-tourism-earth/20",
                isFilterVariant ? "text-xs py-1 px-2" : "text-sm py-1.5 px-3"
              )}
            >
              <Languages className="w-3 h-3 mr-1" />
              {language}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 ml-1.5 hover:bg-transparent"
                onClick={() => removeLanguage(language)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {selectedLanguages.length >= maxSelections && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxSelections} languages can be selected
        </p>
      )}
    </div>
  );
};