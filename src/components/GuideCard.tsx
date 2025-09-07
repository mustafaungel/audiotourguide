import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, MapPin, Users, Heart, Share2, Bookmark, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useNavigate } from "react-router-dom";

interface GuideCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  duration: number;
  category: string;
  difficulty: string;
  imageUrl?: string;
  totalPurchases?: number;
  creatorName?: string;
  creatorAvatar?: string;
  creatorId?: string;
  onViewGuide?: () => void;
}

export function GuideCard({
  id,
  title,
  description,
  location,
  price,
  rating,
  duration,
  category,
  difficulty,
  imageUrl,
  totalPurchases = 0,
  creatorName = "Guide Creator",
  creatorAvatar,
  creatorId,
  onViewGuide
}: GuideCardProps) {
  const { toast } = useToast();
  const { trackEngagement } = useViralTracking();
  const navigate = useNavigate();

  const handleShare = async () => {
    await trackEngagement('share', id, { platform: 'native' });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Guide link copied to clipboard",
      });
    }
  };

  const handleBookmark = async () => {
    await trackEngagement('bookmark', id);
    toast({
      title: "Bookmarked!",
      description: "Guide saved to your library",
    });
  };

  const handleView = async () => {
    await trackEngagement('view', id);
    onViewGuide?.();
  };

  const getCategoryColor = (cat: string) => {
    const colors = {
      cultural: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      historical: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      adventure: "bg-green-100 text-green-800 hover:bg-green-200",
      scenic: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      food: "bg-orange-100 text-orange-800 hover:bg-orange-200"
    };
    return colors[cat as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDifficultyColor = (diff: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800", 
      challenging: "bg-red-100 text-red-800"
    };
    return colors[diff as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-card border-border/50 shadow-card hover:shadow-glow hover:scale-[1.02]" onClick={handleView}>
      <CardHeader className="p-0 relative">
        <div className="aspect-video overflow-hidden">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={getCategoryColor(category)}>
            {category}
          </Badge>
          <Badge className={getDifficultyColor(difficulty)}>
            {difficulty}
          </Badge>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="rounded-full h-16 w-16"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
          >
            <Play className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">{title}</h3>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration} min</span>
            </div>
            {totalPurchases > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{totalPurchases}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (creatorId) {
                  navigate(`/creator/${creatorId}`);
                }
              }}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={creatorAvatar} />
                <AvatarFallback className="text-xs">
                  {creatorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {creatorName}
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${(price / 100).toFixed(2)}</div>
            </div>
          </div>

          <Button 
            variant="default" 
            className="w-full bg-gradient-tourism hover:shadow-tourism"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Audio Tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}