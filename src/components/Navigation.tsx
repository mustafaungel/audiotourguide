import React, { useState } from "react";
import { MapPin, Menu, Search, User, LogOut, X, Globe, Headphones } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveLogo } from "@/components/ResponsiveLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchModal } from "@/components/SearchModal";

export const Navigation = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="mobile-container">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 min-w-0">
            <ResponsiveLogo variant="compact" size="lg" showCompanyName={false} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/guides" className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5" />
              Audio Guides
            </Link>
            <Link to="/country" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Destinations
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <SearchModal>
              <Button variant="ghost" size="icon" className="touch-target">
                <Search className="w-5 h-5" />
              </Button>
            </SearchModal>
            <ThemeToggle />
            
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
  );
};
