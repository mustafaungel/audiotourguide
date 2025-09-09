import React, { useState } from "react";
import { MapPin, Menu, Search, User, LogOut, X, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
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
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-teal-100" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="mobile-text sm:text-lg font-bold font-playfair text-foreground truncate">Audio Tour Guides</span>
                <span className="text-xs text-muted-foreground hidden sm:block">Discover World Heritage</span>
              </div>
            </div>
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
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center relative">
                      <MapPin className="w-3 h-3 text-teal-100" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    Audio Tour Guides
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