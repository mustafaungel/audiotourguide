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

  if (isFeatured) {
    return (
      <div
        className="group rounded-2xl overflow-hidden border border-amber-500/30 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer active:scale-[0.98]"
        onClick={handleView}
      >
        {/* Large image with overlay */}
        <div className="relative w-full h-40 overflow-hidden">
          <OptimizedImage
            src={imageUrl}
            alt={title}
            width={600}
            height={320}
            quality={85}
            loading={imageLoading}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Featured badge */}
          <div className="absolute top-2.5 left-2.5">
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-50 border-0 text-[10px] font-bold px-2 py-0.5 shadow-md">
              <Star className="w-3 h-3 mr-1" fill="currentColor" />
              Featured
            </Badge>
          </div>

          {/* Category badge */}
          <Badge className="absolute top-2.5 right-2.5 bg-black/40 text-white border-0 text-[9px] font-medium px-1.5 py-0 capitalize backdrop-blur-sm">
            {category}
          </Badge>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
            <h3 className="text-white font-extrabold font-heading text-sm leading-tight line-clamp-2 drop-shadow-md">
              {title}
            </h3>
          </div>
        </div>

        {/* Metadata */}
        <div className="px-3 py-2.5 flex flex-col gap-1.5">
          {/* Location & Duration */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
              {location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary/60 shrink-0" />
              {Math.floor(duration / 60)} min
            </span>
          </div>

          {/* Flags + Listening */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {languages && languages.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {languages.map((lang, i) => {
                    const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                    return match ? <span key={i} className="text-xs" title={match.name}>{match.flag}</span> : null;
                  })}
                </div>
              )}
              <LiveListenersBadge guideId={id} variant="inline" />
            </div>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-sm shrink-0"
              disabled={isProcessingPayment}
              onClick={(e) => { e.stopPropagation(); handleView(); }}
            >
              {isProcessingPayment ? (
                <ButtonLoader text="" />
              ) : (
                <Play className="h-3.5 w-3.5 ml-0.5 text-white" fill="currentColor" />
              )}
            </Button>
          </div>
        </div>

        {/* Animated waveform decoration */}
        <div className="flex items-end justify-center gap-[2px] h-3 px-4 pb-1.5 opacity-50">
          {[0, 120, 240, 80, 200, 40, 160, 280, 100, 220, 60, 180, 300, 140, 260].map((delay, i) => (
            <span
              key={i}
              className="inline-block w-[3px] bg-amber-500/60 rounded-full"
              style={{
                height: `${4 + Math.sin(delay * 0.02) * 6}px`,
                animation: 'equalizer-bar 2.2s ease-in-out infinite',
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Normal card layout
  return (
    <div
      className="group rounded-2xl overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      onClick={handleView}
    >
      {/* Top band */}
      <div className="px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-primary via-primary/85 to-primary/70">
        <Headphones className="w-4 h-4 text-primary-foreground shrink-0" />
        <span className="text-xs font-extrabold font-heading truncate tracking-tight text-primary-foreground">
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
          <Badge className="absolute top-1.5 left-1.5 bg-black/50 text-white border-0 text-[9px] font-medium px-1.5 py-0 capitalize backdrop-blur-sm">
            {category}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 py-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 text-primary/60 shrink-0" />
            <span>{Math.floor(duration / 60)} min</span>
          </div>
          {languages && languages.length > 0 && (
            <div className="flex flex-wrap items-center gap-0.5 mt-0.5">
              {languages.map((lang, i) => {
                const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                return match ? <span key={i} className="text-xs" title={match.name}>{match.flag}</span> : null;
              })}
            </div>
          )}
          <LiveListenersBadge guideId={id} variant="inline" />
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
