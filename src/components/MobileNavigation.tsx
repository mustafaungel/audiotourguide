import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Users, 
  User,
  Headphones,
  Calendar,
  MessageSquare,
  Flame
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/',
      badge: null
    },
    {
      icon: Search,
      label: 'Search',
      path: '/search',
      badge: null
    },
    {
      icon: Headphones,
      label: 'Library',
      path: '/library',
      badge: null
    },
    {
      icon: MessageSquare,
      label: 'Community',
      path: '/community',
      badge: '3' // New posts indicator
    },
    {
      icon: user ? User : User,
      label: user ? 'Profile' : 'Sign In',
      path: user ? '/dashboard' : '/auth',
      badge: null
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="grid grid-cols-5 py-2 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-1 relative ${
                active 
                  ? 'text-tourism-warm bg-tourism-warm/10' 
                  : 'text-muted-foreground hover:text-tourism-warm hover:bg-tourism-warm/10'
              }`}
            >
              <div className="relative">
                <IconComponent className="h-5 w-5" />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-tourism-warm rounded-full"></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};