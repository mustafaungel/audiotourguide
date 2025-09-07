import { useParams } from "react-router-dom";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, Users, Play, Calendar, Thermometer, ChevronLeft, Camera } from "lucide-react";

// Demo destination data
const destinationData = {
  "machu-picchu": {
    name: "Machu Picchu",
    country: "Peru",
    region: "Cusco Region",
    description: "The ancient Incan citadel perched high in the Andes Mountains, one of the New Seven Wonders of the World.",
    image: "/src/assets/machu-picchu.jpg",
    coordinates: { lat: -13.1631, lng: -72.5450 },
    elevation: "2,430 meters (7,970 ft)",
    climate: "Subtropical highland climate",
    bestMonths: ["May", "June", "July", "August", "September"],
    guides: [
      {
        id: "1",
        title: "Machu Picchu: Complete Historical Journey", 
        creator: "Dr. Maria Santos",
        duration: 120,
        rating: 4.9,
        reviews: 234,
        price: 12,
        image: "/src/assets/machu-picchu.jpg",
        category: "Historical"
      },
      {
        id: "2",
        title: "Archaeological Mysteries of Machu Picchu",
        creator: "Prof. Carlos Mendoza", 
        duration: 90,
        rating: 4.7,
        reviews: 156,
        price: 10,
        image: "/src/assets/machu-picchu.jpg",
        category: "Archaeological"
      },
      {
        id: "3",
        title: "Spiritual Journey Through the Sacred Valley",
        creator: "Ana Quispe",
        duration: 75,
        rating: 4.8,
        reviews: 89,
        price: 8,
        image: "/src/assets/machu-picchu.jpg", 
        category: "Cultural"
      }
    ],
    creators: [
      {
        id: "1",
        name: "Dr. Maria Santos",
        title: "Archaeological Expert",
        avatar: "/src/assets/guide-museum.jpg",
        rating: 4.8,
        guides: 12,
        specialties: ["Inca History", "Archaeological Sites"]
      },
      {
        id: "2", 
        name: "Prof. Carlos Mendoza",
        title: "Local Historian",
        avatar: "/src/assets/guide-nature.jpg",
        rating: 4.7,
        guides: 8,
        specialties: ["Local Culture", "Sacred Valley"]
      }
    ],
    facts: [
      "Built around 1450 CE during the reign of Inca emperor Pachacuti",
      "Abandoned around 1572 during Spanish conquest",
      "Rediscovered by Hiram Bingham in 1911",
      "Contains over 150 buildings and 3,000 stone steps",
      "UNESCO World Heritage Site since 1983"
    ],
    tips: [
      "Book tickets well in advance - daily visitors are limited",
      "Arrive early morning for fewer crowds and better photos",
      "Bring sunscreen and water - altitude and sun can be intense", 
      "Wear comfortable hiking shoes with good grip",
      "Consider altitude sickness prevention if coming from sea level"
    ]
  }
};

const DestinationDetail = () => {
  const { location } = useParams();
  const [selectedGuide, setSelectedGuide] = useState(null);
  
  // Get destination data - fallback to demo data if not found
  const destination = destinationData[location as keyof typeof destinationData] || destinationData["machu-picchu"];

  const handleGuideClick = (guide: any) => {
    // Navigate to guide detail page
    window.location.href = `/guide/machu-picchu-complete`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to UNESCO Sites
        </Button>

        {/* Hero Section */}
        <div className="relative h-[400px] rounded-2xl overflow-hidden mb-8">
          <img 
            src={destination.image} 
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{destination.name}</h1>
            <div className="flex items-center gap-4 text-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {destination.country}
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                {destination.elevation}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="guides" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="guides">Audio Guides</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="creators">Local Creators</TabsTrigger>
                <TabsTrigger value="tips">Travel Tips</TabsTrigger>
              </TabsList>
              
              <TabsContent value="guides" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Available Audio Guides</h2>
                  <Badge variant="outline">{destination.guides.length} guides available</Badge>
                </div>
                
                <div className="space-y-4">
                  {destination.guides.map((guide) => (
                    <Card key={guide.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handleGuideClick(guide)}>
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0">
                          <img 
                            src={guide.image} 
                            alt={guide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className="absolute top-3 left-3">{guide.category}</Badge>
                        </div>
                        
                        <div className="flex-1 p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-2 flex-1">
                              <h3 className="text-xl font-semibold line-clamp-2">{guide.title}</h3>
                              <p className="text-muted-foreground">by {guide.creator}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {guide.duration} min
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {guide.rating} ({guide.reviews})
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary mb-2">
                                ${guide.price}
                              </div>
                              <Button>
                                <Play className="w-4 h-4 mr-2" />
                                Listen Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="about" className="space-y-6 mt-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">About {destination.name}</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {destination.description}
                  </p>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Historical Facts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {destination.facts.map((fact, index) => (
                        <li key={index} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="creators" className="space-y-4 mt-6">
                <h2 className="text-2xl font-bold">Local Expert Creators</h2>
                
                <div className="grid gap-4">
                  {destination.creators.map((creator) => (
                    <Card key={creator.id} className="p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback>{creator.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{creator.name}</h3>
                          <p className="text-muted-foreground">{creator.title}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {creator.rating}
                            </div>
                            <div>{creator.guides} guides</div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            {creator.specialties.map((specialty) => (
                              <Badge key={specialty} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button variant="outline">
                          View Profile
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="tips" className="space-y-6 mt-6">
                <h2 className="text-2xl font-bold">Essential Travel Tips</h2>
                
                <div className="grid gap-4">
                  {destination.tips.map((tip, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{tip}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region</span>
                  <span className="font-medium">{destination.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Elevation</span>
                  <span className="font-medium">{destination.elevation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Climate</span>
                  <span className="font-medium">{destination.climate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guides Available</span>
                  <span className="font-medium">{destination.guides.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Best Time to Visit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Best Time to Visit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {destination.bestMonths.map((month) => (
                    <Badge key={month} variant="outline" className="px-3 py-1">
                      {month}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Dry season with clear skies and comfortable temperatures for exploration.
                </p>
              </CardContent>
            </Card>

            {/* Photo Spots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Must-See Spots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Huayna Picchu Summit
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Temple of the Sun
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Intihuatana Stone
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Agricultural Terraces
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Ready to Explore?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your journey with expert-guided audio tours
                </p>
                <Button className="w-full">
                  Browse All Guides
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;