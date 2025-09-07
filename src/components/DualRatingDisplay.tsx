import React from 'react';
import { Star, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExperienceBracketBadge } from '@/components/ExperienceBracketBadge';

interface DualRatingDisplayProps {
  serviceRating?: number;
  serviceRatingCount?: number;
  platformRating?: number;
  platformRatingCount?: number;
  combinedRating?: number;
  experienceYears?: number;
  variant?: 'card' | 'inline' | 'detailed';
  showLabels?: boolean;
}

export const DualRatingDisplay: React.FC<DualRatingDisplayProps> = ({
  serviceRating = 0,
  serviceRatingCount = 0,
  platformRating = 0,
  platformRatingCount = 0,
  combinedRating = 0,
  experienceYears = 0,
  variant = 'inline',
  showLabels = true,
}) => {
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-warning text-warning'
                : 'fill-muted text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (variant === 'card') {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1">
              {combinedRating > 0 ? combinedRating.toFixed(1) : 'New'}
            </div>
            {combinedRating > 0 && (
              <div className="flex justify-center mb-2">
                {renderStars(combinedRating, 'md')}
              </div>
            )}
            <p className="text-sm text-muted-foreground">Overall Rating</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-primary/5 rounded-lg p-3 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">User Reviews</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {renderStars(serviceRating)}
                        <span className="text-sm font-bold ml-1">
                          {serviceRating > 0 ? serviceRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs h-5">
                          {serviceRatingCount} reviews
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ratings from travelers who used this creator's services</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-accent/5 rounded-lg p-3 hover:bg-accent/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium text-accent">Platform Rating</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {renderStars(platformRating)}
                        <span className="text-sm font-bold ml-1">
                          {platformRating > 0 ? platformRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {experienceYears > 0 && (
                          <ExperienceBracketBadge 
                            experienceYears={experienceYears} 
                            variant="minimal"
                            showTooltip={false}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Professional rating based on expertise and content quality</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-foreground">
            {combinedRating > 0 ? combinedRating.toFixed(1) : 'New'}
          </div>
          {combinedRating > 0 && renderStars(combinedRating, 'md')}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">User Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              {renderStars(serviceRating)}
              <span className="text-sm font-medium">
                {serviceRating > 0 ? serviceRating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground">
                ({serviceRatingCount})
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">Platform Rating</span>
            </div>
            <div className="flex items-center gap-2">
              {renderStars(platformRating)}
              <span className="text-sm font-medium">
                {platformRating > 0 ? platformRating.toFixed(1) : 'N/A'}
              </span>
              {experienceYears > 0 && (
                <ExperienceBracketBadge 
                  experienceYears={experienceYears} 
                  variant="minimal"
                  showTooltip={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className="flex items-center gap-2">
      {combinedRating > 0 ? (
        <>
          {renderStars(combinedRating)}
          <span className="text-sm font-medium">{combinedRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            ({serviceRatingCount + platformRatingCount})
          </span>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">New Creator</span>
      )}
    </div>
  );
};