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
  // Component disabled - no ratings displayed
  return null;
};