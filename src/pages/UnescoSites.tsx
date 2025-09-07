import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Users, Star, Play } from "lucide-react";

const unescoSites = [
  {
    id: "1",
    name: "Machu Picchu",
    country: "Peru",
    continent: "South America",
    type: "Cultural",
    description: "Ancient Incan citadel set high in the Andes Mountains",
    image: "/src/assets/machu-picchu.jpg",
    guides: 8,
    rating: 4.9,
    inscribed: 1983,
    criteria: ["Cultural", "Natural"]
  },
  {
    id: "2",
    name: "Hagia Sophia",
    country: "Turkey",
    continent: "Europe/Asia",
    type: "Cultural",
    description: "Architectural marvel bridging Christian and Islamic heritage",
    image: "/src/assets/istanbul-hagia-sophia.jpg",
    guides: 12,
    rating: 4.8,
    inscribed: 1985,
    criteria: ["Cultural"]
  },
  {
    id: "3",
    name: "Historic Areas of Istanbul",
    country: "Turkey", 
    continent: "Europe/Asia",
    type: "Cultural",
    description: "Strategic location bridging Europe and Asia with rich Byzantine and Ottoman heritage",
    image: "/src/assets/istanbul-hagia-sophia.jpg",
    guides: 15,
    rating: 4.7,
    inscribed: 1985,
    criteria: ["Cultural"]
  },
  {
    id: "4",
    name: "Goreme National Park",
    country: "Turkey",
    continent: "Europe/Asia", 
    type: "Mixed",
    description: "Unique geological formations and rock-cut churches of Cappadocia",
    image: "/src/assets/cappadocia-goreme.jpg",
    guides: 6,
    rating: 4.8,
    inscribed: 1985,
    criteria: ["Cultural", "Natural"]
  },
  {
    id: "5",
    name: "Historic Centre of Paris",
    country: "France",
    continent: "Europe",
    type: "Cultural", 
    description: "Banks of the Seine and iconic Parisian landmarks",
    image: "/src/assets/paris-louvre.jpg",
    guides: 20,
    rating: 4.6,
    inscribed: 1991,
    criteria: ["Cultural"]
  },
  {
    id: "6",
    name: "Historic Monuments of Kyoto",
    country: "Japan",
    continent: "Asia",
    type: "Cultural",
    description: "Buddhist temples, Shinto shrines and wooden palaces",
    image: "/src/assets/kyoto-temple.jpg", 
    guides: 10,
    rating: 4.9,
    inscribed: 1994,
    criteria: ["Cultural"]
  }
];

const UnescoSites = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContinent, setSelectedContinent] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const filteredSites = unescoSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContinent = selectedContinent === "all" || site.continent === selectedContinent;
    const matchesType = selectedType === "all" || site.type === selectedType;
    
    return matchesSearch && matchesContinent && matchesType;
  });

  const continents = ["all", "Europe", "Asia", "South America", "Europe/Asia"];
  const types = ["all", "Cultural", "Natural", "Mixed"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            UNESCO World Heritage Sites
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover the world's most precious cultural and natural treasures through immersive audio guides
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              1,154 UNESCO Sites Worldwide
            </Badge>
            <Badge variant="outline" className="text-sm px-4 py-2">
              {unescoSites.length} Available with Audio Guides
            </Badge>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search UNESCO sites, countries, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-4 w-full lg:w-auto">
              <Select value={selectedContinent} onValueChange={setSelectedContinent}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Continent" />
                </SelectTrigger>
                <SelectContent>
                  {continents.map(continent => (
                    <SelectItem key={continent} value={continent}>
                      {continent === "all" ? "All Continents" : continent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredSites.length} of {unescoSites.length} UNESCO World Heritage Sites
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSites.map((site) => (
              <Card key={site.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={site.image} 
                    alt={site.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <Badge className="absolute top-3 left-3" variant={site.type === "Cultural" ? "default" : site.type === "Natural" ? "secondary" : "outline"}>
                    {site.type}
                  </Badge>
                  <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {site.inscribed}
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="line-clamp-2">{site.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {site.country}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {site.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        {site.guides} guides
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {site.rating}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.location.href = `/destination/${site.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      Explore Guides
                    </Button>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default UnescoSites;