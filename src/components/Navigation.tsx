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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mobile-container">
        <div className="flex h-14 sm:h-16 items-center justify-between">{/* Mobile-first header height */}
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 min-w-0">
            <ResponsiveLogo variant="full" size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/guides" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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

            {/* Mobile Navigation Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden touch-target">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 mobile-padding">{/* Mobile-first sheet */}
                <SheetHeader>
                  <SheetTitle>
                    <ResponsiveLogo variant="compact" size="sm" />
                  </SheetTitle>
                  <SheetDescription>
                    Discover World Heritage
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mobile-spacing">
                  {/* Mobile Navigation Links */}
                  <nav className="mobile-stack">
                    <Link 
                      to="/country" 
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 text-base font-medium text-foreground hover:text-primary transition-colors touch-target"
                    >
                      <Globe className="w-5 h-5 mr-3" />
                      Destinations
                    </Link>
                    <Link 
                      to="/guides" 
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 text-base font-medium text-foreground hover:text-primary transition-colors touch-target"
                    >
                      <MapPin className="w-5 h-5 mr-3" />
                      Audio Guides
                    </Link>
                  </nav>

                  {/* Admin Section - Only for Admin Users */}
                  {user && userProfile?.role === 'admin' && (
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Admin</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => {
                            navigate('/admin');
                            closeMobileMenu();
                          }}
                        >
                          Admin Dashboard
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={() => {
                            handleSignOut();
                            closeMobileMenu();
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Theme Toggle */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};