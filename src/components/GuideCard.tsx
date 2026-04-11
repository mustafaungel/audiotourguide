import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Headphones, Play } from "lucide-react";
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

  const isFeaturedCard = isFeatured;
  const accentColor = isFeaturedCard ? 'amber' : 'primary';
  const bandGradient = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 via-amber-500/85 to-yellow-500/70'
    : 'bg-gradient-to-r from-primary via-primary/85 to-primary/70';
  const earCupRing = isFeaturedCard
    ? 'ring-amber-500/30 shadow-[0_0_16px_hsl(38_92%_50%/0.15)]'
    : 'ring-primary/25 shadow-[0_0_16px_hsl(var(--primary)/0.12)]';
  const playBtnClass = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
    : 'bg-gradient-tourism hover:shadow-tourism';
  const waveColor = isFeaturedCard ? 'bg-amber-500/60' : 'bg-primary';
  const connectorColor = isFeaturedCard ? 'bg-amber-500/20' : 'bg-primary/15';

  return (
    <div
      className="group cursor-pointer active:scale-[0.98] transition-all duration-300"
      onClick={handleView}
    >
      {/* Headband — curved arch */}
      <div className="headphone-headband relative">
        <div className={`${bandGradient} rounded-[50%_50%_0_0/40px_40px_0_0] px-4 py-2.5 flex items-center justify-center gap-2 min-h-[44px]`}>
          <Headphones className="w-4 h-4 text-primary-foreground shrink-0" />
          <span className="text-[12px] font-extrabold font-heading line-clamp-1 break-words leading-tight tracking-normal text-primary-foreground drop-shadow-sm text-center max-w-[80%]">
            {title}
          </span>
        </div>
      </div>

      {/* Band connectors — thin vertical lines from headband to ear cups */}
      <div className="relative flex justify-between px-[calc(theme(spacing.16)/2+theme(spacing.3))] sm:px-[calc(theme(spacing.18)/2+theme(spacing.3))]">
        <div className={`w-[3px] h-4 ${connectorColor} rounded-full -mt-px ml-1`} />
        <div className={`w-[3px] h-4 ${connectorColor} rounded-full -mt-px mr-1`} />
      </div>

      {/* Main body — ear cups + center metadata */}
      <div className="flex items-center gap-2 px-1">
        {/* Left Ear Cup — Image */}
        <div className={`relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] shrink-0 rounded-[28px] overflow-hidden ring-[3px] ${earCupRing} transition-all duration-300 group-hover:ring-[4px]`}>
          <OptimizedImage
            src={imageUrl}
            alt={`${title} - Audio Guide`}
            width={100}
            height={100}
            quality={80}
            loading={imageLoading}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <Badge className="absolute bottom-1 left-1 bg-black/50 text-white border-0 text-[8px] font-semibold px-1.5 py-0 capitalize backdrop-blur-sm">
            {category}
          </Badge>
        </div>

        {/* Center Metadata */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-1 py-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80">
            <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-foreground/60">
            <Clock className="w-2.5 h-2.5 text-primary/70 shrink-0" />
            <span>{Math.floor(duration / 60)} min</span>
          </div>
          {languages && languages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-0.5">
              {languages.map((lang, i) => {
                const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                return match ? <span key={i} className="text-[10px]" title={match.name}>{match.flag}</span> : null;
              })}
            </div>
          )}
          <LiveListenersBadge guideId={id} size="compact" />
        </div>

        {/* Right Ear Cup — Play Button */}
        <div className={`relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] shrink-0 rounded-[28px] bg-card/90 ring-[3px] ${earCupRing} flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group-hover:ring-[4px]`}>
          {/* Waveform inside ear cup */}
          <div className="flex items-end justify-center gap-[2px] h-3 opacity-50">
            {[0, 120, 240, 80, 200, 40, 160].map((delay, i) => (
              <span
                key={i}
                className={`inline-block w-[2px] ${waveColor} rounded-full`}
                style={{
                  height: `${3 + Math.sin(delay * 0.02) * 5}px`,
                  animation: 'equalizer-bar 2.2s ease-in-out infinite',
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
          <Button
            variant="default"
            size="icon"
            className={`h-10 w-10 rounded-full ${playBtnClass} shadow-md shrink-0`}
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

      {/* Bottom cushion band */}
      <div className={`mx-auto mt-1 w-3/5 h-[3px] rounded-full ${connectorColor}`} />
    </div>
  );
}
