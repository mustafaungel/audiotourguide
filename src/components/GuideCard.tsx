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
        guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl }
      }
    });
  };

  const isFeaturedCard = isFeatured;
  const bandGradient = isFeaturedCard
    ? 'from-amber-500 via-amber-500/85 to-yellow-500/70'
    : 'from-primary via-primary/85 to-primary/70';
  const bandBorder = isFeaturedCard
    ? 'border-amber-500/20'
    : 'border-primary/15';
  const earCupRing = isFeaturedCard
    ? 'ring-amber-500/25 shadow-[0_4px_20px_hsl(38_92%_50%/0.12)]'
    : 'ring-primary/20 shadow-[0_4px_20px_hsl(var(--primary)/0.08)]';
  const playBtnClass = isFeaturedCard
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
    : 'bg-gradient-tourism hover:shadow-tourism';
  const waveColor = isFeaturedCard ? 'bg-amber-500/60' : 'bg-primary';
  const sideColor = isFeaturedCard ? 'border-amber-500/15' : 'border-primary/10';
  const cushionColor = isFeaturedCard ? 'bg-amber-500/12' : 'bg-primary/8';

  return (
    <div
      className="group cursor-pointer active:scale-[0.98] transition-all duration-300"
      onClick={handleView}
    >
      {/* Headband — thin elegant arch */}
      <div className="px-8">
        <div className={`bg-gradient-to-r ${bandGradient} rounded-[50%_50%_0_0/50px_50px_0_0] px-5 py-1.5 flex items-center justify-center min-h-[36px] shadow-sm`}>
          <span className="text-[11px] font-bold font-heading line-clamp-2 break-words leading-tight tracking-wide text-primary-foreground/95 text-center">
            {title}
          </span>
        </div>
      </div>

      {/* Curved side bands connecting headband to ear cups */}
      <div className={`relative mx-8 h-4 border-l-2 border-r-2 ${sideColor} rounded-b-[0_0_12px_12px]`} />

      {/* Flare out — side bands widen toward ear cups */}
      <div className={`relative mx-6 h-3 border-l-2 border-r-2 ${sideColor} rounded-b-lg`} />

      {/* Main body — ear cups + center metadata */}
      <div className="flex items-center gap-1 px-0.5">
        {/* Left Ear Cup — Image */}
        <div className={`relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] shrink-0 rounded-full overflow-hidden ring-[2px] ${earCupRing} transition-all duration-300 group-hover:ring-[3px] group-hover:shadow-lg`}>
          <OptimizedImage
            src={imageUrl}
            alt={`${title} - Audio Guide`}
            width={96}
            height={96}
            quality={80}
            loading={imageLoading}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <Badge className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/50 text-white border-0 text-[7px] font-semibold px-1.5 py-0 capitalize backdrop-blur-sm whitespace-nowrap">
            {category}
          </Badge>
        </div>

        {/* Center Metadata */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-0.5 py-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-foreground/80">
            <MapPin className="w-2.5 h-2.5 text-primary/70 shrink-0" />
            <span className="truncate max-w-full">{location}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-medium text-foreground/55">
            <Clock className="w-2.5 h-2.5 text-primary/60 shrink-0" />
            <span>{Math.floor(duration / 60)} min</span>
          </div>
          {languages && languages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-0.5">
              {languages.map((lang, i) => {
                const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
                return match ? <span key={i} className="text-[9px]" title={match.name}>{match.flag}</span> : null;
              })}
            </div>
          )}
          <LiveListenersBadge guideId={id} size="compact" />
        </div>

        {/* Right Ear Cup — Play Button */}
        <div className={`relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] shrink-0 rounded-full bg-card/80 ring-[2px] ${earCupRing} flex flex-col items-center justify-center gap-1 transition-all duration-300 group-hover:ring-[3px] group-hover:shadow-lg`}>
          {/* Waveform */}
          <div className="flex items-end justify-center gap-[2px] h-2.5 opacity-40">
            {[0, 120, 240, 80, 200, 40, 160].map((delay, i) => (
              <span
                key={i}
                className={`inline-block w-[1.5px] ${waveColor} rounded-full`}
                style={{
                  height: `${3 + Math.sin(delay * 0.02) * 4}px`,
                  animation: 'equalizer-bar 2.2s ease-in-out infinite',
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
          <Button
            variant="default"
            size="icon"
            className={`h-9 w-9 rounded-full ${playBtnClass} shadow-md shrink-0`}
            disabled={isProcessingPayment}
            onClick={(e) => { e.stopPropagation(); handleView(); }}
          >
            {isProcessingPayment ? (
              <ButtonLoader text="" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" fill="currentColor" />
            )}
          </Button>
        </div>
      </div>

      {/* Bottom cushion band — connects ear cups underneath */}
      <div className="px-6">
        <div className={`mx-auto h-3 border-l-2 border-r-2 ${sideColor} rounded-t-lg`} />
      </div>
      <div className="px-8">
        <div className={`h-[3px] rounded-full ${cushionColor}`} />
      </div>
    </div>
  );
}
