import React, { useState } from 'react';
import { Search, Filter, MapPin, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchModal } from './SearchModal';
import { useNavigate } from 'react-router-dom';

interface SearchHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterOpen?: () => void;
  showResults?: boolean;
  resultsCount?: number;
}

export function SearchHeader({ 
  searchTerm, 
  onSearchChange, 
  onFilterOpen,
  showResults = false,
  resultsCount = 0 
}: SearchHeaderProps) {
  const navigate = useNavigate();
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);

  const popularSearches = [
    "UNESCO World Heritage",
    "Paris Museums", 
    "Istanbul Culture",
    "Kyoto Temples",
    "Italian Art",
    "Ancient Rome"
  ];

  const recentSearches = [
    "Louvre Museum",
    "Hagia Sophia",
    "Machu Picchu"
  ];

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsVoiceSearchActive(true);
      // Voice search implementation would go here
      setTimeout(() => {
        setIsVoiceSearchActive(false);
        // Simulate voice input
        onSearchChange("Paris cultural sites");
      }, 2000);
    } else {
      alert("Voice search not supported in your browser");
    }
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        {/* Main Search Bar */}
        <div className="max-w-3xl mx-auto mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search destinations, UNESCO sites, or cultural experiences..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-20 h-14 text-lg bg-card/50 backdrop-blur-sm border-border/50 rounded-full"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full h-10 w-10 p-0"
                onClick={handleVoiceSearch}
                disabled={isVoiceSearchActive}
              >
                <Mic className={`h-5 w-5 ${isVoiceSearchActive ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-4"
                onClick={onFilterOpen}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {[
            { name: "Near Me", icon: "📍", path: "/search?near=me" },
            { name: "UNESCO Sites", icon: "🏛️", path: "/unesco-sites" },
            { name: "Free Guides", icon: "🆓", path: "/search?price=free" },
            { name: "Cultural", icon: "🎭", path: "/category/cultural" },
            { name: "Historical", icon: "📚", path: "/category/historical" },
            { name: "Adventure", icon: "🏔️", path: "/category/adventure" }
          ].map((filter) => (
            <Button
              key={filter.name}
              variant="secondary"
              size="sm"
              className="rounded-full hover:scale-105 transition-all duration-200 gap-2"
              onClick={() => navigate(filter.path)}
            >
              <span>{filter.icon}</span>
              {filter.name}
            </Button>
          ))}
        </div>

        {/* Search Results Info */}
        {showResults && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {resultsCount > 0 
                ? `Found ${resultsCount} audio guide${resultsCount === 1 ? '' : 's'}${searchTerm ? ` for "${searchTerm}"` : ''}`
                : searchTerm 
                  ? `No results found for "${searchTerm}"`
                  : 'Start typing to search for audio guides'
              }
            </p>
          </div>
        )}

        {/* Popular & Recent Searches */}
        {!searchTerm && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Popular Searches */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((search) => (
                    <Badge
                      key={search}
                      variant="secondary"
                      className="cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => onSearchChange(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <Badge
                      key={search}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => onSearchChange(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}