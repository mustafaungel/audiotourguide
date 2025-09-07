import { useParams } from "react-router-dom";
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, Users, Play, Download, Share2, Bookmark, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Demo guide data
const guideData = {
  "machu-picchu-complete": {
    id: "1",
    title: "Machu Picchu: Complete Historical Journey",
    description: "Embark on a comprehensive exploration of the Lost City of the Incas. This immersive audio guide reveals the mysteries, engineering marvels, and spiritual significance of this ancient citadel.",
    location: "Machu Picchu, Peru",
    duration: 120,
    rating: 4.9,
    totalReviews: 234,
    price: 12,
    currency: "USD",
    image: "/src/assets/machu-picchu.jpg",
    audioUrl: "/public/tmp/guide1.mp3",
    category: "Historical",
    difficulty: "Easy",
    languages: ["English", "Spanish", "Quechua"],
    creator: {
      id: "creator1",
      name: "Dr. Maria Santos",
      avatar: "/src/assets/guide-museum.jpg",
      title: "Archaeological Expert",
      rating: 4.8,
      guides: 12,
      verified: true
    },
    chapters: [
      { title: "Welcome to Machu Picchu", duration: 8, timestamp: 0 },
      { title: "The Discovery Story", duration: 12, timestamp: 480 },
      { title: "Inca Engineering Marvels", duration: 15, timestamp: 1200 },
      { title: "Sacred Spaces & Temples", duration: 18, timestamp: 2100 },
      { title: "Daily Life in the Citadel", duration: 14, timestamp: 3180 },
      { title: "Mysteries Yet Unsolved", duration: 16, timestamp: 4020 },
      { title: "Conservation Efforts", duration: 11, timestamp: 4980 },
      { title: "Your Journey Continues", duration: 6, timestamp: 5640 }
    ],
    highlights: [
      "Explore the Intihuatana Stone",
      "Discover the Temple of the Sun", 
      "Learn about Inca astronomy",
      "Understand the agricultural terraces"
    ],
    included: [
      "2-hour premium audio guide",
      "Interactive map with GPS",
      "Downloadable transcript",
      "Photo spots recommendations"
    ]
  }
};

const reviews = [
  {
    id: 1,
    user: "Sarah M.",
    rating: 5,
    comment: "Absolutely incredible! Dr. Santos brought Machu Picchu to life with fascinating historical details and perfect pacing.",
    date: "2 days ago",
    verified: true
  },
  {
    id: 2, 
    user: "Michael R.",
    rating: 5,
    comment: "Best audio guide I've ever used. The storytelling made me feel like I was walking with the Incas themselves.",
    date: "1 week ago",
    verified: true
  },
  {
    id: 3,
    user: "Ana L.",
    rating: 4,
    comment: "Great content and very informative. Would love more guides from this creator!",
    date: "2 weeks ago", 
    verified: false
  }
];

const relatedGuides = [
  {
    id: "2",
    title: "Sacred Valley Explorer",
    creator: "Carlos Mendoza",
    rating: 4.7,
    price: 8,
    image: "/src/assets/kyoto-temple.jpg"
  },
  {
    id: "3", 
    title: "Cusco: Heart of the Inca Empire",
    creator: "Dr. Maria Santos",
    rating: 4.8,
    price: 10,
    image: "/src/assets/cappadocia-goreme.jpg"
  }
];

const GuideDetail = () => {
  const { guideId } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [playingGuide, setPlayingGuide] = useState(false);
  const [isPurchased] = useState(false); // Demo: set to true to show purchased state
  const { toast } = useToast();

  // Get guide data - fallback to demo data if not found
  const guide = guideData[guideId as keyof typeof guideData] || guideData["machu-picchu-complete"];

  const handlePurchase = () => {
    toast({
      title: "Purchase Initiated",
      description: "Redirecting to secure checkout...",
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from Library" : "Added to Library",
      description: isBookmarked ? "Guide removed from your bookmarks" : "Guide saved to your bookmarks",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: guide.title,
        text: guide.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Guide link copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Guides
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img 
                src={guide.image} 
                alt={guide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <Badge className="mb-2">{guide.category}</Badge>
                <h1 className="text-2xl md:text-3xl font-bold">{guide.title}</h1>
              </div>
            </div>

            {/* Guide Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {guide.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {guide.duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {guide.rating} ({guide.totalReviews})
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{guide.difficulty}</Badge>
                      {guide.languages.map(lang => (
                        <Badge key={lang} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBookmark}>
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Tabs defaultValue="chapters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="highlights">Highlights</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-3">
                {guide.chapters.map((chapter, index) => (
                  <Card key={index} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{chapter.title}</h4>
                          <p className="text-sm text-muted-foreground">{chapter.duration} minutes</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="highlights" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">What You'll Discover</h4>
                    <ul className="space-y-2">
                      {guide.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">What's Included</h4>
                    <ul className="space-y-2">
                      {guide.included.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{review.user}</h5>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({length: review.rating}).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${guide.price} {guide.currency}
                  </div>
                  <p className="text-sm text-muted-foreground">One-time purchase</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isPurchased ? (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => setPlayingGuide(true)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Audio Guide
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download for Offline
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" onClick={handlePurchase}>
                    Purchase Guide
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Creator Card */}
            <Card>
              <CardHeader>
                <CardTitle>Meet Your Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={guide.creator.avatar} />
                    <AvatarFallback>{guide.creator.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{guide.creator.name}</h4>
                      {guide.creator.verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{guide.creator.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {guide.creator.rating}
                  </div>
                  <div>{guide.creator.guides} guides</div>
                </div>
                
                <Button variant="outline" className="w-full" size="sm">
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Related Guides */}
            <Card>
              <CardHeader>
                <CardTitle>Related Guides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedGuides.map((relatedGuide) => (
                  <div key={relatedGuide.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <img 
                      src={relatedGuide.image} 
                      alt={relatedGuide.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm line-clamp-2">{relatedGuide.title}</h5>
                      <p className="text-xs text-muted-foreground">{relatedGuide.creator}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{relatedGuide.rating}</span>
                        </div>
                        <span className="text-xs font-medium">${relatedGuide.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {playingGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t">
          <div className="container mx-auto">
            <AudioPlayer 
              title={guide.title}
              description={guide.description}
              guideId={guide.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDetail;