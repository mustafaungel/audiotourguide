import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextareaWithCounter, InputWithCounter } from '@/components/ui/character-counter';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GuideCreationFormProps {
  onSubmit: (data: GuideFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface GuideFormData {
  title: string;
  description: string;
  location: string;
  category: string;
  difficulty: string;
  price: number;
  duration: number;
  languages: string[];
  bestTime: string;
}

const CATEGORIES = [
  'Historical Sites',
  'Museums & Galleries',
  'Cultural Tours',
  'Nature & Wildlife',
  'Food & Cuisine',
  'Architecture',
  'Religious Sites',
  'Local Markets',
  'Street Art',
  'Neighborhoods'
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy - All ages welcome' },
  { value: 'moderate', label: 'Moderate - Some walking required' },
  { value: 'challenging', label: 'Challenging - Good fitness needed' }
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Turkish', 'Greek', 'Swedish', 'Norwegian', 'Danish'
];

export const GuideCreationForm: React.FC<GuideCreationFormProps> = ({
  onSubmit,
  isSubmitting = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [bestTime, setBestTime] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim() || !description.trim() || !location.trim() || !category || !difficulty) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (title.length > 80) {
      toast({
        title: "Title too long",
        description: "Title must be 80 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (description.length > 500) {
      toast({
        title: "Description too long", 
        description: "Description must be 500 characters or less",
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseInt(price);
    const durationNum = parseInt(duration);

    if (isNaN(priceNum) || priceNum < 1) {
      toast({
        title: "Invalid price",
        description: "Price must be at least $1",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(durationNum) || durationNum < 5) {
      toast({
        title: "Invalid duration",
        description: "Duration must be at least 5 minutes",
        variant: "destructive",
      });
      return;
    }

    const formData: GuideFormData = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      difficulty,
      price: priceNum * 100, // Convert to cents
      duration: durationNum,
      languages: selectedLanguages,
      bestTime: bestTime.trim()
    };

    await onSubmit(formData);
  };

  const addLanguage = () => {
    if (newLanguage && !selectedLanguages.includes(newLanguage)) {
      setSelectedLanguages([...selectedLanguages, newLanguage]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    if (language !== 'English') { // Keep English as default
      setSelectedLanguages(selectedLanguages.filter(l => l !== language));
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Audio Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <InputWithCounter
                maxLength={80}
                label="Guide Title *"
                placeholder="Enter an engaging title for your guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                helpText="Make it descriptive and engaging"
                showProgress
              />
            </div>

            {/* Location */}
            <InputWithCounter
              maxLength={100}
              label="Location *"
              placeholder="City, Country or specific venue"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              helpText="Be specific about the location"
            />

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category *</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-medium mb-2 block">Price (USD) *</label>
              <input
                type="number"
                min="1"
                max="999"
                placeholder="9.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: $3-15 for most guides
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-2 block">Duration (minutes) *</label>
              <input
                type="number"
                min="5"
                max="180"
                placeholder="45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Typical guides are 30-60 minutes
              </p>
            </div>

            {/* Difficulty */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Difficulty Level *</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <TextareaWithCounter
            maxLength={500}
            label="Description *"
            placeholder="Describe what travelers will experience and learn..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
            helpText="Highlight unique insights and experiences you'll share"
            showProgress
          />

          {/* Languages */}
          <div>
            <label className="text-sm font-medium mb-2 block">Languages Available</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((language) => (
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
              
              <div className="flex gap-2">
                <Select value={newLanguage} onValueChange={setNewLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(lang => !selectedLanguages.includes(lang)).map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLanguage}
                  disabled={!newLanguage}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Best Time to Visit */}
          <TextareaWithCounter
            maxLength={200}
            label="Best Time to Visit (Optional)"
            placeholder="When is the best time to experience this location?"
            value={bestTime}
            onChange={(e) => setBestTime(e.target.value)}
            className="min-h-[80px]"
            helpText="Share seasonal tips or optimal visiting times"
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Creating Guide...' : 'Create Audio Guide'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};