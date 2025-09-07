import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getExperienceBracket } from '@/types/creator';

interface ExperienceBracketBadgeProps {
  experienceYears: number;
  showTooltip?: boolean;
  variant?: 'default' | 'minimal';
}

export const ExperienceBracketBadge: React.FC<ExperienceBracketBadgeProps> = ({
  experienceYears,
  showTooltip = true,
  variant = 'default',
}) => {
  const bracket = getExperienceBracket(experienceYears);
  
  const badge = (
    <Badge 
      variant="secondary" 
      className={`${bracket.color} text-white border-0 ${
        variant === 'minimal' ? 'text-xs px-2 py-0.5' : ''
      }`}
    >
      {bracket.label}
      {variant === 'default' && ` (${experienceYears}y)`}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{bracket.label} Creator</p>
            <p className="text-sm text-muted-foreground">
              {experienceYears} years experience
            </p>
            <p className="text-xs text-muted-foreground">
              Max platform rating: {bracket.maxRating}/5.0
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};