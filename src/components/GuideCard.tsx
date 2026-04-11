import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Headphones, Play, Star } from "lucide-react";
import { ButtonLoader } from "@/components/AudioGuideLoader";
import { useViralTracking } from "@/hooks/useViralTracking";
import { LiveListenersBadge } from "@/components/LiveListenersBadge";
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
  isFeatured?: boolean;
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
  isFeatured = false,
  imageLoading = 'lazy',
  isProcessingPayment = false,
}: GuideCardProps) {
  const { trackEngagement } = useViralTracking();
  const navigate = useNavigate();

  const handleView = () => {
    trackEngagement('view', id);
    navigate(`/guide/${slug || id}`, {
      state: {
        guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl }
      }
    });
  };

  return (
    <div
      className="group rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      onClick={handleView}
    >
      {/* Top band — Guide title (golden for featured) */}
      <div className={`px-4 py-2 flex items-center gap-2 ${
        isFeatured
          ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500'
          : 'bg-gradient-to-r from-primary via-primary/85 to-primary/70'
      }`}>
        {isFeatured ? (
          <Star className="w-4 h-4 text-amber-100 shrink-0" fill="currentColor" />
        ) : (
          <Headphones className="w-4 h-4 text-primary-foreground shrink-0" />
        )}
        <span className={`text-xs font-extrabold font-heading truncate tracking-tight ${
          isFeatured ? 'text-amber-50' : 'text-primary-foreground'
        }`}>
          {title}
        </span>
      </div>

      {/* Main content — horizontal layout */}
      <div className="flex gap-3 p-3">
        {/* Image thumbnail */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden shadow-md">
          <OptimizedImage
            src={imageUrl}
            alt={title}
            width={144}
            height={144}
            quality={80}
            loading={imageLoading}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Category badge */}
          <Badge className="absolute top-1.5 left-1.5 bg-black/50 text-white border-0 text-[9px] font-medium px-1.5 py-0 capitalize backdrop-blur-sm">
            {category}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 py-0.5">
          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
            <span>{location}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 text-primary/60 shrink-0" />
            <span>{Math.floor(duration / 60)} min</span>
          </div>

          {/* Language flags */}
          {languages && languages.length > 0 && (
            <div className="flex flex-wrap items-center gap-0.5 mt-0.5">
              {languages.map((lang, i) => {
                const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                return match ? <span key={i} className="text-xs" title={match.name}>{match.flag}</span> : null;
              })}
            </div>
          )}

          {/* Live listeners */}
          <LiveListenersBadge guideId={id} variant="inline" />

          {/* Play */}
          <div className="flex items-center mt-1.5 self-end">
            <Button
              variant="default"
              size="icon"
              className="h-9 w-9 rounded-full bg-gradient-tourism hover:shadow-tourism shadow-sm shrink-0"
              disabled={isProcessingPayment}
              onClick={(e) => { e.stopPropagation(); handleView(); }}
            >
              {isProcessingPayment ? (
                <ButtonLoader text="" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom waveform decoration */}
      <div className="flex items-end justify-center gap-[2px] h-3 px-4 pb-1.5 opacity-40">
        {[0, 120, 240, 80, 200, 40, 160, 280, 100, 220, 60, 180, 300, 140, 260].map((delay, i) => (
          <span
            key={i}
            className="inline-block w-[3px] bg-primary rounded-full"
            style={{
              height: `${4 + Math.sin(delay * 0.02) * 6}px`,
              animation: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
