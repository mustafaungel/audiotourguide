import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LiveExperience {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  experience_type: string;
  duration_minutes: number;
  price_usd: number;
  max_participants: number;
  location?: string;
  image_url?: string;
  difficulty_level: string;
  category: string;
  language: string;
  creator?: {
    full_name: string;
    avatar_url?: string;
    verification_status: string;
  };
}

interface LiveExperienceCardProps {
  experience: LiveExperience;
  onBook?: (experienceId: string) => void;
}

export const LiveExperienceCard: React.FC<LiveExperienceCardProps> = ({ 
  experience, 
  onBook 
}) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return `$${price}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getExperienceTypeLabel = (type: string) => {
    switch (type) {
      case 'virtual_tour': return 'Virtual Tour';
      case 'live_walkthrough': return 'Live Walkthrough';
      case 'cultural_experience': return 'Cultural Experience';
      case 'cooking_class': return 'Cooking Class';
      default: return type;
    }
  };

  const handleBookClick = () => {
    if (onBook) {
      onBook(experience.id);
    } else {
      navigate(`/experience/${experience.id}`);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {experience.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={experience.image_url} 
            alt={experience.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {getExperienceTypeLabel(experience.experience_type)}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm font-semibold">
              {formatPrice(experience.price_usd)}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {experience.title}
            </CardTitle>
            {experience.creator && (
              <div className="flex items-center gap-2 mt-2">
                {experience.creator.avatar_url && (
                  <img 
                    src={experience.creator.avatar_url} 
                    alt={experience.creator.full_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  by {experience.creator.full_name}
                </span>
                {experience.creator.verification_status === 'verified' && (
                  <Star className="w-4 h-4 text-primary fill-current" />
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {experience.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatDuration(experience.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>Max {experience.max_participants}</span>
          </div>
          {experience.location && (
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{experience.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {experience.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {experience.difficulty_level}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {experience.language}
          </Badge>
        </div>

        <Button 
          onClick={handleBookClick}
          className="w-full"
          size="sm"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Experience
        </Button>
      </CardContent>
    </Card>
  );
};