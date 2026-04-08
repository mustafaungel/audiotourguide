import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Heart, Share2, Bookmark, Play } from "lucide-react";
import { ButtonLoader } from "@/components/AudioGuideLoader";
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
      cultural: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50",
      historical: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50",
      adventure: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50",
      scenic: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50",
      food: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
    };
    return colors[cat as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const getDifficultyColor = (diff: string) => {
    const colors = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", 
      challenging: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    };
    return colors[diff as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer select-none bg-gradient-card border-border/50 shadow-card hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] h-full flex flex-col" onClick={handleView}>
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
            className="bg-card/80 backdrop-blur-sm hover:bg-card min-h-[44px] min-w-[44px] p-2 touch-manipulation"
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
            className="bg-card/80 backdrop-blur-sm hover:bg-card min-h-[44px] min-w-[44px] p-2 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="rounded-full h-16 w-16 bg-primary flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 ml-1 text-primary-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
          <div>
            <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 h-[2.75rem] sm:h-[3.25rem] overflow-hidden">{title}</h3>
          </div>

          <p className="text-muted-foreground text-sm sm:text-base line-clamp-2 leading-relaxed h-[2.5rem] sm:h-[3rem] overflow-hidden">{description}</p>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-nowrap overflow-hidden h-[1.5rem]">
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

          <div className="flex justify-center pt-2 mt-auto">
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
              <ButtonLoader text="Processing..." />
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