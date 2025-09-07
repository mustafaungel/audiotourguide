import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, MapPin, Users } from 'lucide-react';

interface VerificationBadgeProps {
  type: 'local_guide' | 'influencer' | 'blue_tick' | 'unverified';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  type,
  size = 'md',
  showText = true
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'local_guide':
        return {
          icon: MapPin,
          text: 'Verified Local Guide',
          variant: 'default' as const,
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
        };
      case 'influencer':
        return {
          icon: Users,
          text: 'Verified Influencer',
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        };
      case 'blue_tick':
        return {
          icon: CheckCircle,
          text: 'Verified',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
      case 'unverified':
        return {
          icon: Shield,
          text: 'Unverified',
          variant: 'outline' as const,
          className: 'text-muted-foreground border-muted-foreground/30'
        };
      default:
        return {
          icon: Shield,
          text: 'Unknown',
          variant: 'outline' as const,
          className: 'text-muted-foreground'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  if (!showText) {
    return (
      <div className={`inline-flex items-center justify-center rounded-full p-1 ${config.className}`}>
        <Icon className={iconSize} />
      </div>
    );
  }

  return (
    <Badge variant={config.variant} className={`${config.className} ${textSize}`}>
      <Icon className={`${iconSize} mr-1`} />
      {config.text}
    </Badge>
  );
};