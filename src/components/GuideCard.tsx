import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Bookmark, Share2, Play, Headphones } from "lucide-react";
import { ButtonLoader } from "@/components/AudioGuideLoader";
import { useToast } from "@/hooks/use-toast";
import { useViralTracking } from "@/hooks/useViralTracking";
import { useNavigate } from "react-router-dom";
import { OptimizedImage } from "@/components/OptimizedImage";
import { ELEVENLABS_LANGUAGES } from "@/data/countries-full";

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
  languages?: string[];
  imageLoading?: 'lazy' | 'eager';
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
  duration,
  category,
  imageUrl,
  languages,
  imageLoading = 'lazy',
  isProcessingPayment = false,
}: GuideCardProps) {
  const { toast } = useToast();
  const { trackEngagement } = useViralTracking();
  const navigate = useNavigate();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEngagement('share', id, { platform: 'native' });
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: window.location.href });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Guide link copied to clipboard" });
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEngagement('bookmark', id);
    toast({ title: "Bookmarked!", description: "Guide saved to your library" });
  };

  const handleView = () => {
    trackEngagement('view', id);
    navigate(`/guide/${slug || id}`, {
      state: {
        guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl }
      }
    });
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      cultural: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      historical: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      adventure: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      scenic: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      food: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return colors[cat] || "bg-muted text-muted-foreground";
  };

  return (
    <Card
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer select-none bg-card border-border/30 shadow-card audio-card-glow hover:scale-[1.02] active:scale-[0.98] h-full flex flex-col"
      onClick={handleView}
    >
      {/* Image Section */}
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          <OptimizedImage
            src={imageUrl}
            alt={`${title} - Audio tour guide in ${location}`}
            width={400}
            height={300}
            quality={75}
            loading={imageLoading}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Waveform bars at bottom of image — 11 bars premium */}
          <div className="card-waveform absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-5 px-4 pb-1">
            {[0, 120, 240, 80, 200, 40, 160, 280, 100, 220, 60].map((delay, i) => (
              <span key={i} className="waveform-bar" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getCategoryColor(category)} text-[10px] font-medium px-2 py-0.5 audio-premium-badge capitalize`}>
            {category}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 rounded-full bg-card/60 backdrop-blur-md hover:bg-card border-0 touch-manipulation"
            onClick={handleBookmark}
          >
            <Bookmark className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7 rounded-full bg-card/60 backdrop-blur-md hover:bg-card border-0 touch-manipulation"
            onClick={handleShare}
          >
            <Share2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Hover overlay — headphone + sound waves */}
        <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="rounded-full h-14 w-14 bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg play-button-glow">
            <Headphones className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardHeader>

      {/* Content Section */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col gap-2">
          {/* Title with headphone icon */}
          <div className="flex items-start gap-2">
            <Headphones className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{title}</h3>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{description}</p>

          {/* Metadata — single compact line */}
          <div className="flex items-center text-[11px] text-muted-foreground mt-auto pt-1">
            <MapPin className="h-3 w-3 shrink-0 mr-1" />
            <span className="truncate max-w-[60%]">{location}</span>
            <span className="mx-1.5">·</span>
            <Clock className="h-3 w-3 shrink-0 mr-1" />
            <span className="whitespace-nowrap">{Math.floor(duration / 60)} min</span>
          </div>

          {/* Language flags — all languages shown */}
          {languages && languages.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-1">
              {languages.map((lang, i) => {
                const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                return match ? <span key={i} className="text-sm" title={match.name}>{match.flag}</span> : null;
              })}
            </div>
          )}
        </div>

        {/* Price + CTA row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
          <span className="text-base font-bold">${(price / 100).toFixed(2)}</span>
          <Button
            variant="default"
            size="sm"
            className="ml-auto bg-gradient-tourism hover:shadow-tourism min-h-[36px] text-xs font-medium touch-manipulation gap-1.5 rounded-full px-4"
            disabled={isProcessingPayment}
            onClick={(e) => {
              e.stopPropagation();
              if (!isProcessingPayment) handleView();
            }}
          >
            {isProcessingPayment ? (
              <ButtonLoader text="..." />
            ) : (
              <>
                <Headphones className="h-3.5 w-3.5" />
                Listen Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
