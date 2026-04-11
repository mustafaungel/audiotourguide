import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  label: string;
  sublabel?: string;
  type: 'guide' | 'location' | 'country';
  slug?: string;
  id?: string;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  className?: string;
  onNavigate?: (suggestion: Suggestion) => void;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = 'Search...',
  className,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  // Filter suggestions based on debounced value
  const filteredSuggestions = debouncedValue.length >= 2
    ? suggestions
        .filter(s =>
          s.label.toLowerCase().includes(debouncedValue.toLowerCase()) ||
          (s.sublabel && s.sublabel.toLowerCase().includes(debouncedValue.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((suggestion: Suggestion) => {
    if (onNavigate) {
      onNavigate(suggestion);
    } else if (suggestion.type === 'guide' && suggestion.slug) {
      navigate(`/guide/${suggestion.slug}`);
    } else if (suggestion.type === 'country' && suggestion.slug) {
      navigate(`/country/${suggestion.slug}`);
    } else {
      onChange(suggestion.label);
    }
    setIsOpen(false);
  }, [onNavigate, navigate, onChange]);

  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'guide': return <Headphones className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'location': return <MapPin className="h-4 w-4 text-primary flex-shrink-0" />;
      case 'country': return <MapPin className="h-4 w-4 text-primary flex-shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "flex h-12 w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm pl-10 pr-10 py-2 text-[16px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.label}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/30 last:border-b-0 touch-target"
            >
              {getIcon(suggestion.type)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{suggestion.label}</p>
                {suggestion.sublabel && (
                  <p className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</p>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 flex-shrink-0">
                {suggestion.type === 'guide' ? 'Guide' : suggestion.type === 'country' ? 'Country' : 'Location'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
