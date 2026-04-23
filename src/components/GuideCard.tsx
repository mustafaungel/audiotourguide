import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Play } from "lucide-react";
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
  const waveColor = isFeaturedCard ? 'bg-amber-500/55' : 'bg-primary/80';
  const playBtnClass = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
    : 'bg-gradient-tourism hover:shadow-tourism';
  const hoverShadow = isFeaturedCard ? 'hover:shadow-amber-500/10' : 'hover:shadow-primary/5';
  const metaChipClass = isFeaturedCard
    ? 'border-amber-500/20 bg-amber-500/10 text-foreground/80'
    : 'border-primary/15 bg-primary/5 text-foreground/80';

  return (
    <div className="card-3d" onClick={handleView}>
      <div
        className={`card-3d-inner group audio-card-glow overflow-hidden rounded-[26px] border ${accentBorder} bg-card/82 backdrop-blur-md shadow-[var(--shadow-card)] hover:shadow-elevated ${hoverShadow} ${isFeaturedCard ? 'hover:border-amber-500/60' : 'hover:border-primary/30'} cursor-pointer transition-all duration-300 active:scale-[0.98]`}
      >
      {/* Top band */}
      <div className={`flex items-start px-4 py-3 ${bandGradient}`}>
        <span className="min-w-0 flex-1 text-[12px] font-extrabold font-heading leading-tight tracking-normal text-primary-foreground drop-shadow-sm line-clamp-2 break-words">
          {title}
        </span>
      </div>

      {/* Main content — horizontal layout */}
      <div className="flex gap-3.5 p-3.5">
        {/* Image thumbnail */}
        <div className="relative h-[132px] w-[112px] shrink-0 overflow-hidden rounded-[18px] shadow-[var(--shadow-raised)] sm:h-[144px] sm:w-[120px]">
          <OptimizedImage
            src={imageUrl}
            alt={`${title} - Audio Guide`}
            width={400}
            height={225}

            loading={imageLoading}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />
          <Badge className="glass-badge absolute left-2 top-2 border-0 px-2 py-0.5 text-[10px] font-semibold capitalize text-foreground">
            {category}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between overflow-hidden py-0.5">
          <div className="space-y-3">
            <div className="flex items-start gap-1.5 text-sm font-semibold text-foreground/80 card-text-primary">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="line-clamp-2 leading-snug">{location}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${metaChipClass}`}>
                <Clock className="h-3 w-3 shrink-0 text-primary/70" />
                <span>{Math.floor(duration / 60)} min</span>
              </div>
              {languages && languages.length > 0 && (
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${metaChipClass}`}>
                  <span className="flex items-center gap-0.5">
                    {languages.slice(0, 4).map((lang, i) => {
                      const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                      return match ? <span key={i} title={match.name}>{match.flag}</span> : null;
                    })}
                  </span>
                  {languages.length > 4 && <span>+{languages.length - 4}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/20 pt-3">
            <div className="min-w-0 flex-1">
              <LiveListenersBadge guideId={id} size="compact" />
            </div>
            <Button
              variant="default"
              size="icon"
              className={`h-11 w-11 rounded-full ${playBtnClass} shrink-0 shadow-[var(--shadow-interactive)]`}
              disabled={isProcessingPayment}
              onClick={(e) => { e.stopPropagation(); handleView(); }}
            >
              {isProcessingPayment ? (
                <ButtonLoader text="" />
              ) : (
                <Play className="ml-0.5 h-4.5 w-4.5" fill="currentColor" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom waveform decoration */}
      <div className="flex h-3 items-end justify-center gap-[2px] px-4 pb-2 opacity-30">
        {[0, 120, 240, 80, 200, 40, 160, 280, 100, 220, 60, 180, 300, 140, 260].map((delay, i) => (
          <span
            key={i}
            className={`inline-block w-[3px] ${waveColor} rounded-full`}
            style={{
              height: `${4 + Math.sin(delay * 0.02) * 6}px`,
              animation: 'equalizer-bar 2.2s ease-in-out infinite',
              animationDelay: `-${2200 - delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
    </div>
  );
}
