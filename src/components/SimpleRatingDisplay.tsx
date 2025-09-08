import React from 'react';
import { Star } from 'lucide-react';

interface SimpleRatingDisplayProps {
  rating?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const SimpleRatingDisplay: React.FC<SimpleRatingDisplayProps> = ({
  rating = 0,
  size = 'sm',
  className = ''
}) => {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
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
      <span className="text-sm font-medium ml-1">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
    </div>
  );
};