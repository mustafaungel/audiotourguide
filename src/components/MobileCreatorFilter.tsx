import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter
} from '@/components/ui/drawer';
import { LanguageSelector } from './LanguageSelector';
import { Separator } from '@/components/ui/separator';
import { X, Filter, MapPin, Star, Languages, Award, User, SortAsc } from 'lucide-react';

interface MobileCreatorFilterProps {
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (value: string) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (value: string[]) => void;
  selectedTier: string;
  setSelectedTier: (value: string) => void;
  selectedCreatorType: string;
  setSelectedCreatorType: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  locations: string[];
  specialties: string[];
  onClearAll: () => void;
}

export const MobileCreatorFilter = ({
  selectedLocation,
  setSelectedLocation,
  selectedSpecialty,
  setSelectedSpecialty,
  selectedLanguages,
  setSelectedLanguages,
  selectedTier,
  setSelectedTier,
  selectedCreatorType,
  setSelectedCreatorType,
  sortBy,
  setSortBy,
  locations,
  specialties,
  onClearAll
}: MobileCreatorFilterProps) => {
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedLocation && selectedLocation !== 'all-locations') count++;
    if (selectedSpecialty && selectedSpecialty !== 'all-specialties') count++;
    if (selectedLanguages.length > 0) count++;
    if (selectedTier && selectedTier !== 'all-tiers') count++;
    if (selectedCreatorType && selectedCreatorType !== 'all-types') count++;
    if (sortBy !== 'best_match') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const getActiveFilters = () => {
    const filters = [];
    
    if (selectedLocation && selectedLocation !== 'all-locations') {
      filters.push({
        label: selectedLocation,
        icon: MapPin,
        onRemove: () => setSelectedLocation('all-locations')
      });
    }
    
    if (selectedSpecialty && selectedSpecialty !== 'all-specialties') {
      filters.push({
        label: selectedSpecialty,
        icon: Star,
        onRemove: () => setSelectedSpecialty('all-specialties')
      });
    }
    
    if (selectedLanguages.length > 0) {
      filters.push({
        label: `${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''}`,
        icon: Languages,
        onRemove: () => setSelectedLanguages([])
      });
    }
    
    if (selectedTier && selectedTier !== 'all-tiers') {
      filters.push({
        label: `${selectedTier} tier`,
        icon: Award,
        onRemove: () => setSelectedTier('all-tiers')
      });
    }
    
    if (selectedCreatorType && selectedCreatorType !== 'all-types') {
      filters.push({
        label: selectedCreatorType.replace('_', ' '),
        icon: User,
        onRemove: () => setSelectedCreatorType('all-types')
      });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();

  const quickFilters = [
    { label: 'Art Guides', location: '', specialty: 'Art History', type: 'cultural_expert' },
    { label: 'Food Experts', location: '', specialty: 'Food Culture', type: 'local_guide' },
    { label: 'History Buffs', location: '', specialty: 'History', type: 'historian' },
    { label: 'Photo Tours', location: '', specialty: 'Photography', type: 'photographer' }
  ];

  const applyQuickFilter = (filter: typeof quickFilters[0]) => {
    if (filter.specialty) setSelectedSpecialty(filter.specialty);
    if (filter.type) setSelectedCreatorType(filter.type);
  };

  return (
    <div className="space-y-3">
      {/* Filter Trigger */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-10"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </Button>
        </DrawerTrigger>

        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Filter Creators</DrawerTitle>
            <DrawerDescription>
              Find the perfect guide for your needs
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
            {/* Quick Filters */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Star className="w-4 h-4" />
                Quick Filters
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickFilter(filter)}
                    className="h-8 text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Primary Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location & What
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Where</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-locations">Any location</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">What</label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-specialties">Any specialty</SelectItem>
                      {specialties.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Secondary Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Languages & Experience
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Languages</label>
                  <LanguageSelector
                    selectedLanguages={selectedLanguages}
                    onLanguagesChange={setSelectedLanguages}
                    variant="filter"
                    placeholder="Any language"
                    maxSelections={5}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Experience Level</label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-tiers">Any level</SelectItem>
                      <SelectItem value="bronze">Bronze (Beginner)</SelectItem>
                      <SelectItem value="silver">Silver (Intermediate)</SelectItem>
                      <SelectItem value="gold">Gold (Advanced)</SelectItem>
                      <SelectItem value="platinum">Platinum (Expert)</SelectItem>
                      <SelectItem value="diamond">Diamond (Master)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Advanced Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Guide Type & Sort
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Guide Type</label>
                  <Select value={selectedCreatorType} onValueChange={setSelectedCreatorType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-types">Any type</SelectItem>
                      <SelectItem value="local_guide">Local Guide</SelectItem>
                      <SelectItem value="cultural_expert">Cultural Expert</SelectItem>
                      <SelectItem value="historian">Historian</SelectItem>
                      <SelectItem value="photographer">Photographer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Best match" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best_match">Best Match</SelectItem>
                      <SelectItem value="highest_rated">Highest Rated</SelectItem>
                      <SelectItem value="most_followed">Most Followed</SelectItem>
                      <SelectItem value="most_guides">Most Guides</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="most_experienced">Most Experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={onClearAll}
              className="flex-1"
            >
              Clear All
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1">
                Apply Filters
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge 
              key={index}
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 pr-1"
            >
              <filter.icon className="w-3 h-3" />
              <span className="text-xs">{filter.label}</span>
              <button
                onClick={filter.onRemove}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};