import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, MapPin, Users, Heart, Share2, Play, Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface EnhancedGuideCardProps {
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
  isProcessingPayment?: boolean;
  isPurchased?: boolean;
  onViewGuide?: () => void;
  onPreview?: () => void;
}

export function EnhancedGuideCard({
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
  creatorName = "AI Guide Creator",
  creatorAvatar,
  creatorId,
  isProcessingPayment = false,
  isPurchased = false,
  onViewGuide,
  onPreview
}: EnhancedGuideCardProps) {
  const { toast } = useToast();
  const { trackEngagement } = useViralTracking();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await trackEngagement('share', id, { platform: 'native' });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: `${window.location.origin}/guide/${id}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/guide/${id}`);
      toast({
        title: "Link copied!",
        description: "Guide link copied to clipboard",
      });
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    await trackEngagement('bookmark', id);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Guide removed from your favorites" : "Guide saved to your favorites",
    });
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(true);
    onPreview?.();
    toast({
      title: "Preview Playing",
      description: "30-second preview of the audio guide",
    });
  };

  const handleView = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await trackEngagement('view', id);
    onViewGuide?.();
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${(price / 100).toFixed(2)}`;
  };

  const formatDuration = (duration: number) => {
    return `${Math.floor(duration / 60)} min`;
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer bg-card border-border/50 shadow-card hover:shadow-glow hover:scale-[1.02]"
      onClick={() => handleView()}
    >
      {/* Large Image Header */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-border/50">
            {category}
          </Badge>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="bg-background/90 backdrop-blur-sm hover:bg-background min-h-[40px] min-w-[40px] p-2"
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-background/90 backdrop-blur-sm hover:bg-background min-h-[40px] min-w-[40px] p-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview/Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {isPurchased || price === 0 ? (
            <Button 
              variant="hero" 
              size="lg" 
              className="rounded-full h-16 w-16 shadow-xl"
              onClick={(e) => handleView(e)}
            >
              <Play className="h-6 w-6 ml-1" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-full bg-background/90 backdrop-blur-sm"
                onClick={handlePreview}
              >
                <Volume2 className="h-5 w-5 mr-2" />
                Preview
              </Button>
              <Button 
                variant="hero" 
                size="lg" 
                className="rounded-full shadow-xl"
                onClick={(e) => handleView(e)}
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-lg font-bold px-3 py-1">
            {formatPrice(price)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Title and Rating */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 flex-1">{title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Location and Quick Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(duration)}</span>
            </div>
            {totalPurchases > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{totalPurchases}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{description}</p>

          {/* Creator Info */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creatorAvatar} />
              <AvatarFallback className="text-xs bg-primary/10">
                {creatorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{creatorName}</p>
              <p className="text-xs text-muted-foreground">Audio Guide Creator</p>
            </div>
            {/* AI Badge */}
            <Badge variant="outline" className="text-xs">
              AI Generated
            </Badge>
          </div>

          {/* Action Button */}
          <Button 
            variant="default" 
            className="w-full bg-gradient-tourism hover:shadow-tourism min-h-[48px] text-base font-semibold"
            disabled={isProcessingPayment}
            onClick={(e) => handleView(e)}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : isPurchased || price === 0 ? (
              <>
                <Play className="h-5 w-5 mr-2" />
                Listen Now
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Get Audio Guide
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}