import React, { useState } from "react";
import { MapPin, Menu, Search, User, LogOut, X } from "lucide-react";
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
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-lg font-bold font-playfair text-foreground truncate">Audio Tour Guides</span>
                <span className="text-xs text-muted-foreground hidden sm:block">Discover World Heritage</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/library" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Audio Guides
            </Link>
            <Link to="/experiences" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Live Experiences
            </Link>
            <Link to="/creators" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Creators
            </Link>
            <Link to="/unesco-sites" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              UNESCO Sites
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <SearchModal>
              <Button variant="ghost" size="icon" className="w-10 h-10 sm:w-9 sm:h-9 min-h-[44px] touch-manipulation">
                <Search className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            </SearchModal>
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 px-2 sm:px-3 min-h-[44px] touch-manipulation">
                    <User className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline text-sm truncate max-w-[100px]">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/library')}>
                    <span>My Library</span>
                  </DropdownMenuItem>
                  {userProfile?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  {(userProfile?.role === 'content_creator' || userProfile?.verification_status === 'verified') && (
                    <DropdownMenuItem onClick={() => navigate('/creator-dashboard')}>
                      <span>Creator Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  {userProfile?.role === 'traveler' && (
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <span>Become a Creator</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hidden sm:flex min-h-[44px] touch-manipulation">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="default" size="sm" className="min-h-[44px] touch-manipulation text-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Navigation Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden w-10 h-10 min-h-[44px] touch-manipulation">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Audio Tour Guides
                  </SheetTitle>
                  <SheetDescription>
                    Discover World Heritage
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-8 space-y-6">
                  {/* Mobile Navigation Links */}
                  <nav className="space-y-4">
                    <Link 
                      to="/library" 
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Audio Guides
                    </Link>
                    <Link 
                      to="/experiences" 
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Live Experiences
                    </Link>
                    <Link 
                      to="/creators" 
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Creators
                    </Link>
                    <Link 
                      to="/unesco-sites" 
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      UNESCO Sites
                    </Link>
                  </nav>

                  {/* User Section */}
                  {user ? (
                    <div className="space-y-4 pt-6 border-t">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => {
                            navigate('/profile');
                            closeMobileMenu();
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => {
                            navigate('/library');
                            closeMobileMenu();
                          }}
                        >
                          My Library
                        </Button>
                        {userProfile?.role === 'admin' && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => {
                              navigate('/admin');
                              closeMobileMenu();
                            }}
                          >
                            Admin Panel
                          </Button>
                        )}
                        {(userProfile?.role === 'content_creator' || userProfile?.verification_status === 'verified') && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => {
                              navigate('/creator-dashboard');
                              closeMobileMenu();
                            }}
                          >
                            Creator Dashboard
                          </Button>
                        )}
                        {userProfile?.role === 'traveler' && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => {
                              navigate('/profile');
                              closeMobileMenu();
                            }}
                          >
                            Become a Creator
                          </Button>
                        )}
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
                  ) : (
                    <div className="space-y-3 pt-6 border-t">
                      <Link to="/auth" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={closeMobileMenu}>
                        <Button variant="default" className="w-full">
                          Get Started
                        </Button>
                      </Link>
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