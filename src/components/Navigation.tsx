import React from "react";
import { MapPin, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Navigation = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold font-playfair text-foreground">Audio Tour Guides</span>
                <span className="text-xs text-muted-foreground hidden sm:block">Discover World Heritage</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#destinations" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Destinations
            </a>
            <a href="#heritage" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              UNESCO Sites
            </a>
            <a href="#experiences" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Cultural Experiences
            </a>
            <a href="#museums" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Museums
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Search className="w-4 h-4" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="md:hidden w-9 h-9">
              <Menu className="w-4 h-4" />
            </Button>
            <Button variant="default" size="sm" className="hidden sm:flex">
              Explore Tours
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};