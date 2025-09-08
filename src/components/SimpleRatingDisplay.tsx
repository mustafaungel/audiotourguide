import React from 'react';

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
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-sm font-medium">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
    </div>
  );
};