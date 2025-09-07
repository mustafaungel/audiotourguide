import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, MapPin, GraduationCap } from 'lucide-react';

interface CreatorTypeBadgeProps {
  type: 'influencer' | 'local_guide' | 'expert';
  variant?: 'default' | 'compact';
  className?: string;
}

export const CreatorTypeBadge: React.FC<CreatorTypeBadgeProps> = ({ 
  type, 
  variant = 'default',
  className = '' 
}) => {
  const config = {
    influencer: {
      icon: Crown,
      label: 'Influencer',
      description: 'Viral content creator',
      className: 'bg-gradient-primary text-primary-foreground border-primary/20 hover:bg-gradient-primary/90'
    },
    local_guide: {
      icon: MapPin,
      label: 'Local Guide',
      description: 'Authentic local experiences',
      className: 'bg-gradient-tourism text-primary-foreground border-tourism-warm/20 hover:bg-gradient-tourism/90'
    },
    expert: {
      icon: GraduationCap,
      label: 'Expert',
      description: 'Specialized knowledge',
      className: 'bg-gradient-accent text-accent-foreground border-accent/20 hover:bg-gradient-accent/90'
    }
  };

  // Handle unknown creator types with fallback
  const typeConfig = config[type] || {
    icon: MapPin,
    label: 'Creator',
    description: 'Content creator',
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/90'
  };

  const { icon: Icon, label, description, className: badgeClassName } = typeConfig;

  if (variant === 'compact') {
    return (
      <Badge className={`${badgeClassName} ${className} flex items-center gap-1 text-xs`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={`${badgeClassName} flex items-center gap-1.5 text-sm font-medium px-3 py-1`}>
        <Icon className="h-4 w-4" />
        {label}
      </Badge>
      <span className="text-xs text-muted-foreground hidden sm:block">{description}</span>
    </div>
  );
};