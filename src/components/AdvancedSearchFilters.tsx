import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, DollarSign, Globe, Mic, X } from 'lucide-react';

interface FilterState {
  location: string;
  categories: string[];
  languages: string[];
  priceRange: number[];
  durationRange: number[];
  minRating: number;
  difficulty: string[];
  features: string[];
  accessibility: string[];
}

interface AdvancedSearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset
}) => {
  const categories = [
    'UNESCO Heritage',
    'Cultural Sites',
    'Natural Wonders',
    'Historical Tours',
    'Architecture',
    'Museums',
    'Art Galleries',
    'Religious Sites',
    'Archaeological Sites',
    'City Tours'
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Japanese',
    'Mandarin',
    'Arabic',
    'Russian'
  ];

  const difficulties = ['Easy', 'Moderate', 'Challenging'];
  
  const features = [
    'Audio Commentary',
    'Interactive Maps',
    'Offline Access',
    'Multi-Language',
    'Family Friendly',
    'Professional Guide',
    'Local Insights',
    'Historical Context'
  ];

  const accessibilityOptions = [
    'Wheelchair Accessible',
    'Audio Descriptions',
    'Large Text',
    'Sign Language',
    'Sensory Friendly',
    'Easy Navigation'
  ];

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.location) count++;
    if (filters.categories.length > 0) count++;
    if (filters.languages.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++;
    if (filters.durationRange[0] > 15 || filters.durationRange[1] < 180) count++;
    if (filters.minRating > 0) count++;
    if (filters.difficulty.length > 0) count++;
    if (filters.features.length > 0) count++;
    if (filters.accessibility.length > 0) count++;
    return count;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="location" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="accessibility">Access</TabsTrigger>
          </TabsList>

          {/* Location & Geography */}
          <TabsContent value="location" className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                placeholder="Search by city, country, or landmark..."
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-3 block">Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => toggleArrayFilter('categories', category)}
                    />
                    <Label htmlFor={category} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Content & Quality */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Mic className="h-4 w-4" />
                Languages
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={filters.languages.includes(language)}
                      onCheckedChange={() => toggleArrayFilter('languages', language)}
                    />
                    <Label htmlFor={language} className="text-sm">
                      {language}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating filter removed - using text-based reviews only */}

            <div>
              <Label className="mb-3 block">Features</Label>
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={filters.features.includes(feature)}
                      onCheckedChange={() => toggleArrayFilter('features', feature)}
                    />
                    <Label htmlFor={feature} className="text-sm">
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Experience Parameters */}
          <TabsContent value="experience" className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4" />
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value)}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Free</span>
                <span>$100+</span>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                Duration: {filters.durationRange[0]} - {filters.durationRange[1]} minutes
              </Label>
              <Slider
                value={filters.durationRange}
                onValueChange={(value) => updateFilter('durationRange', value)}
                max={180}
                min={15}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15 min</span>
                <span>3+ hours</span>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Difficulty Level</Label>
              <div className="flex gap-2">
                {difficulties.map((difficulty) => (
                  <div key={difficulty} className="flex items-center space-x-2">
                    <Checkbox
                      id={difficulty}
                      checked={filters.difficulty.includes(difficulty)}
                      onCheckedChange={() => toggleArrayFilter('difficulty', difficulty)}
                    />
                    <Label htmlFor={difficulty} className="text-sm">
                      {difficulty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Accessibility */}
          <TabsContent value="accessibility" className="space-y-4">
            <div>
              <Label className="mb-3 block">Accessibility Features</Label>
              <div className="grid grid-cols-1 gap-2">
                {accessibilityOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={filters.accessibility.includes(option)}
                      onCheckedChange={() => toggleArrayFilter('accessibility', option)}
                    />
                    <Label htmlFor={option} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="border-t pt-4">
            <Label className="mb-2 block text-sm font-medium">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.location}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('location', '')}
                  />
                </Badge>
              )}
              {filters.categories.map((category) => (
                <Badge key={category} variant="secondary" className="flex items-center gap-1">
                  {category}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleArrayFilter('categories', category)}
                  />
                </Badge>
              ))}
              {filters.languages.map((language) => (
                <Badge key={language} variant="secondary" className="flex items-center gap-1">
                  {language}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleArrayFilter('languages', language)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={onApply} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={onReset}>
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};