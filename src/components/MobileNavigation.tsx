import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Users, 
  User,
  Headphones,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      icon: Search,
      label: "Explore",
      path: "/search",
    },
    {
      icon: Headphones,
      label: "Library",
      path: "/library",
    },
    {
      icon: Users,
      label: "Community",
      path: "/community",
      badge: "New"
    },
    {
      icon: user ? User : LogIn,
      label: user ? "Profile" : "Sign In",
      path: user ? "/profile" : "/auth",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border md:hidden mobile-safe-area">
      <div className="mobile-container">
        <div className="grid grid-cols-5 gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center touch-target rounded-lg transition-all duration-200",
                  "hover:bg-accent/10 active:scale-95",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
                  )}
                </div>
                <span className={cn(
                  "mobile-caption font-medium mt-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};