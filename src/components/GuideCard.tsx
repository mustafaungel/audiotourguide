import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, MapPin, Star } from 'lucide-react';

interface GuideCardProps {
  title: string;
  description: string;
  duration: string;
  location: string;
  rating: number;
  category: string;
  imageUrl?: string;
  onPlay?: () => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({
  title,
  description,
  duration,
  location,
  rating,
  category,
  imageUrl,
  onPlay,
}) => {
  return (
    <Card className="bg-gradient-card border-border/50 shadow-card overflow-hidden group hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-hero flex items-center justify-center">
            <div className="text-6xl opacity-20">🎧</div>
          </div>
        )}
        
        {/* Category Badge */}
        <Badge 
          className="absolute top-3 left-3 bg-card/80 backdrop-blur-sm text-foreground border-border/50"
        >
          {category}
        </Badge>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="rounded-full h-16 w-16"
            onClick={onPlay}
          >
            <Play className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground line-clamp-2">{title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-3">{description}</p>
        </div>

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            <span>{rating}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onPlay}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Audio Guide
        </Button>
      </div>
    </Card>
  );
};