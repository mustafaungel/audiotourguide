import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Award, Gem } from 'lucide-react';

interface TierBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const tierConfig = {
  bronze: {
    icon: Award,
    color: '#CD7F32',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-800 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  silver: {
    icon: Star,
    color: '#C0C0C0',
    bgColor: 'bg-slate-100 dark:bg-slate-900/20',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-800'
  },
  gold: {
    icon: Crown,
    color: '#FFD700',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-800 dark:text-yellow-300',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  diamond: {
    icon: Gem,
    color: '#B9F2FF',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    textColor: 'text-cyan-800 dark:text-cyan-300',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  }
};

export const TierBadge: React.FC<TierBadgeProps> = ({ 
  tier, 
  size = 'md', 
  showIcon = true, 
  className = '' 
}) => {
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.bronze;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <Badge 
      variant="outline"
      className={`
        ${config.bgColor} 
        ${config.textColor} 
        ${config.borderColor}
        ${sizeClasses[size]}
        font-medium capitalize
        ${className}
      `}
    >
      {showIcon && (
        <Icon 
          size={iconSizes[size]} 
          className="mr-1" 
          style={{ color: config.color }}
        />
      )}
      {tier}
    </Badge>
  );
};