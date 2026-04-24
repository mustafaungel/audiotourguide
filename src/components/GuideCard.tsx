import { Button } from "@/components/ui/button";
import { Clock, MapPin, Play, Headphones } from "lucide-react";
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

  const isFeaturedCard = isFeatured;
  // Thin accent line color (replaces the thick gradient band)
  const accentLineClass = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500'
    : 'bg-gradient-to-r from-primary via-primary/70 to-primary';
  // Subtle card tint
  const cardTintClass = isFeaturedCard
    ? 'bg-amber-50/40 dark:bg-amber-500/5'
    : 'bg-card';
  const borderClass = isFeaturedCard
    ? 'border-amber-500/25 hover:border-amber-500/50'
    : 'border-border/60 hover:border-primary/30';
  const playBtnClass = isFeaturedCard
    ? 'bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white'
    : 'bg-gradient-tourism hover:shadow-tourism text-primary-foreground';
  // Static (non-animated) waveform color
  const waveColor = isFeaturedCard ? 'bg-amber-500/40' : 'bg-primary/40';
  const featuredBadgeClass = isFeaturedCard
    ? 'bg-foreground text-background'
    : 'bg-primary text-primary-foreground';

  return (
    <div className="card-3d" onClick={handleView}>
      <div
        className={`card-3d-inner group relative overflow-hidden rounded-2xl border ${borderClass} ${cardTintClass} shadow-[0_2px_8px_hsl(var(--foreground)/0.04)] hover:shadow-[0_8px_24px_hsl(var(--foreground)/0.08)] cursor-pointer transition-all duration-300 active:scale-[0.99]`}
      >
        {/* Thin accent line at top */}
        <div className={`h-[3px] w-full ${accentLineClass}`} />

        {/* Main content — GYG-style horizontal */}
        <div className="flex gap-3 p-3">
          {/* Square-ish image */}
          <div className="relative aspect-square h-[140px] w-[140px] shrink-0 overflow-hidden rounded-xl shadow-[var(--shadow-raised)] sm:h-[150px] sm:w-[150px]">
            <OptimizedImage
              src={imageUrl}
              alt={`${title} - Audio Guide`}
              width={400}
              height={400}
              loading={imageLoading}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {/* Top-left badges stack: Duration + Live listeners */}
            <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
              <div className="inline-flex items-center gap-1 rounded-md bg-foreground/75 px-1.5 py-0.5 text-[10px] font-semibold text-background backdrop-blur-sm">
                <Headphones className="h-2.5 w-2.5" />
                <span>{Math.floor(duration / 60)}m</span>
              </div>
              <LiveListenersBadge guideId={id} size="compact" />
            </div>
          </div>

          {/* Right content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div className="space-y-1.5">
              {/* Small location label (GYG: small gray above title) */}
              <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </div>

              {/* Big bold title */}
              <h3 className="font-heading text-[15px] font-bold leading-tight text-foreground line-clamp-2 break-words">
                {title}
              </h3>

              {/* Meta row: category + duration */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span className="capitalize">{category}</span>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {Math.floor(duration / 60)} min
                </span>
              </div>

              {/* Featured badge — GYG "Top pick" style */}
              {isFeaturedCard && (
                <div className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${featuredBadgeClass}`}>
                  Featured
                </div>
              )}

              {/* Languages flags — minimal inline */}
              {languages && languages.length > 0 && (
                <div className="flex items-center gap-0.5 text-sm">
                  {languages.slice(0, 3).map((lang, i) => {
                    const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                    return match ? <span key={i} title={match.name}>{match.flag}</span> : null;
                  })}
                  {languages.length > 3 && (
                    <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">+{languages.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom row: play button (listeners moved to image overlay) */}
            <div className="mt-2 flex items-center justify-end gap-2">
              <Button
                variant="default"
                size="icon"
                className={`h-10 w-10 rounded-full ${playBtnClass} shrink-0 shadow-[var(--shadow-interactive)]`}
                disabled={isProcessingPayment}
                onClick={(e) => { e.stopPropagation(); handleView(); }}
                aria-label={`Play ${title}`}
              >
                {isProcessingPayment ? (
                  <ButtonLoader text="" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Static waveform decoration — audio identity, no animation */}
        <div className="flex h-2.5 items-end justify-center gap-[2px] px-4 pb-2 opacity-50">
          {[3, 6, 4, 8, 5, 9, 4, 7, 5, 8, 3, 6, 4, 7, 5, 8, 4, 6, 3, 5].map((h, i) => (
            <span
              key={i}
              className={`inline-block w-[2px] ${waveColor} rounded-full`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
