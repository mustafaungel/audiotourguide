import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Heart, Share2, Bookmark, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useNavigate } from "react-router-dom";
import { OptimizedImage } from "@/components/OptimizedImage";

interface GuideCardProps {
  id: string;
  slug?: string;
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
  isProcessingPayment?: boolean;
  onViewGuide?: () => void;
}

export function GuideCard({
  id,
  slug,
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
  isProcessingPayment = false,
  onViewGuide
}: GuideCardProps) {
  const { toast } = useToast();
  const { trackEngagement } = useViralTracking();
  const navigate = useNavigate();

  const handleShare = async () => {
    trackEngagement('share', id, { platform: 'native' });
    
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

  const handleBookmark = () => {
    trackEngagement('bookmark', id);
    toast({
      title: "Bookmarked!",
      description: "Guide saved to your library",
    });
  };

  const handleView = () => {
    trackEngagement('view', id);
    navigate(`/guide/${slug || id}`, {
      state: {
        guidePreview: { id, slug, title, description, location, price, duration, category, difficulty, imageUrl }
      }
    });
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer select-none bg-gradient-card border-border/50 shadow-card hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]" onClick={handleView}>
      <CardHeader className="p-0 relative">
        <div className="aspect-video overflow-hidden bg-muted">
          <OptimizedImage
            src={imageUrl}
            alt={`${title} - Audio tour guide in ${location}`}
            width={400}
            height={225}
            quality={75}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <div className="absolute top-4 left-4">
          <Badge className={getCategoryColor(category)}>
            {category}
          </Badge>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/80 backdrop-blur-sm hover:bg-white min-h-[44px] min-w-[44px] p-2 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/80 backdrop-blur-sm hover:bg-white min-h-[44px] min-w-[44px] p-2 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <Share2 className="h-5 w-5" />
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

      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2">{title}</h3>
          </div>

          <p className="text-muted-foreground text-sm sm:text-base line-clamp-2 leading-relaxed">{description}</p>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(duration / 60)} min</span>
            </div>
            {totalPurchases > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{totalPurchases}</span>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold">${(price / 100).toFixed(2)}</div>
            </div>
          </div>

          <Button 
            variant="default" 
            className="w-full bg-gradient-tourism hover:shadow-tourism min-h-[48px] text-base sm:text-lg touch-manipulation"
            disabled={isProcessingPayment}
            onClick={(e) => {
              e.stopPropagation();
              if (!isProcessingPayment) {
                handleView();
              }
            }}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Audio Tour
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}