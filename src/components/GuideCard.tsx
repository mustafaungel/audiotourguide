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
        guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl, isFeatured }
      }
    });
  };

  // Featured and normal cards share the same horizontal layout
  // Featured gets amber accents, normal gets primary
  const isFeaturedCard = isFeatured;
  const accentBorder = isFeaturedCard ? 'border-amber-500/50' : 'border-primary/30';
  const bandGradient = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 via-amber-500/85 to-yellow-500/70'
    : 'bg-gradient-to-r from-primary via-primary/85 to-primary/70';
  const waveColor = isFeaturedCard ? 'bg-amber-500/60' : 'bg-primary';
  const playBtnClass = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
    : 'bg-gradient-tourism hover:shadow-tourism';
  const hoverShadow = isFeaturedCard ? 'hover:shadow-amber-500/10' : 'hover:shadow-primary/5';

  return (
    <div className="card-3d" onClick={handleView}>
      <div
        className={`card-3d-inner group rounded-2xl overflow-hidden border ${accentBorder} bg-card/80 backdrop-blur-sm shadow-card hover:shadow-elevated ${hoverShadow} ${isFeaturedCard ? 'hover:border-amber-500/60' : 'hover:border-primary/30'} transition-all duration-300 cursor-pointer active:scale-[0.98]`}
      >
      {/* Top band */}
      <div className={`px-4 py-2.5 flex items-start ${bandGradient}`}>
        <span className="flex-1 min-w-0 text-[12px] font-extrabold font-heading line-clamp-2 break-words leading-tight tracking-normal text-primary-foreground drop-shadow-sm">
          {title}
        </span>
      </div>

      {/* Main content — horizontal layout */}
      <div className="flex gap-3 p-3">
        {/* Image thumbnail */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden shadow-md">
          <OptimizedImage
            src={imageUrl}
            alt={`${title} - Audio Guide`}
            width={144}
            height={144}

            loading={imageLoading}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <Badge className="absolute top-1.5 left-1.5 glass-badge text-foreground border-0 text-[10px] font-semibold px-1.5 py-0 capitalize">
            {category}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center gap-1.5 py-0.5">
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground/80 card-text-primary">
            <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground/60 card-text-secondary">
            <Clock className="w-3 h-3 text-primary/70 shrink-0" />
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
          <LiveListenersBadge guideId={id} size="compact" />
          <div className="flex items-center mt-1.5 self-end">
            <Button
              variant="default"
              size="icon"
              className={`h-9 w-9 rounded-full ${playBtnClass} shadow-sm shrink-0`}
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
            className={`inline-block w-[3px] ${waveColor} rounded-full`}
            style={{
              height: `${4 + Math.sin(delay * 0.02) * 6}px`,
              animation: 'equalizer-bar 2.2s ease-in-out infinite',
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
    </div>
  );
}
