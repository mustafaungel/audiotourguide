import React from "react";
import { User, LogOut, Headphones, Compass, LibraryBig, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveLogo } from "@/components/ResponsiveLogo";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  sticky?: boolean;
}

export const Navigation = ({ sticky = true }: NavigationProps) => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const desktopLinks = [
    { to: '/', label: 'Discover', icon: Compass },
    { to: '/guides', label: 'Audio Guides', icon: Headphones },
    { to: '/country', label: 'Destinations', icon: Compass },
    { to: '/library', label: 'Library', icon: LibraryBig },
  ];

  return (
    <>
      <header className={`${sticky ? 'sticky top-0' : 'relative'} z-50 w-full border-b border-border/30 bg-background/95 supports-[backdrop-filter]:bg-background/75 backdrop-blur-xl`}>
        <div className="mobile-container">
          <div className="flex h-16 items-center justify-between gap-3 py-2">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="rounded-2xl border border-border/40 bg-card/70 px-3 py-2 shadow-[var(--shadow-card)]">
              <ResponsiveLogo variant="compact" size="lg" showCompanyName={false} />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Audio-first travel</p>
              <p className="text-sm font-semibold text-foreground line-clamp-1">Discover while you listen</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 rounded-full border border-border/40 bg-card/70 p-1.5 shadow-[var(--shadow-card)]">
            {desktopLinks.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to);

              return (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-[var(--shadow-interactive)]' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {!user && (
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/admin-login">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
            
            {user && userProfile?.role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 px-2 touch-target">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm truncate max-w-[100px]">
                      Admin
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>
      </div>
      </header>
      <MobileBottomNav />
    </>
  );
};
