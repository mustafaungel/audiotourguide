import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Headphones } from "lucide-react";
import { ButtonLoader } from "@/components/AudioGuideLoader";
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
    <div
      className="group flex gap-4 p-4 rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      onClick={handleView}
      style={{ fontFamily: "'Lora', 'Playfair Display', Georgia, serif" }}
    >
      {/* Image — larger square with rounded corners */}
      <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 rounded-xl overflow-hidden shadow-md">
        <OptimizedImage
          src={imageUrl}
          alt={title}
          width={160}
          height={160}
          quality={80}
          loading={imageLoading}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Category badge */}
        <Badge className={`absolute top-2 left-2 ${getCategoryColor(category)} text-[9px] font-semibold px-2 py-0.5 capitalize shadow-sm`}>
          {category}
        </Badge>
        {/* Price badge on image */}
        <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg shadow-lg backdrop-blur-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          ${(price / 100).toFixed(2)}
        </div>
        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Headphones className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center gap-1.5">
        {/* Title */}
        <h3 className="font-bold text-[15px] leading-snug line-clamp-2 tracking-tight" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          {title}
        </h3>

        {/* Location + Duration */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="flex items-center gap-0.5 min-w-0">
            <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            <Clock className="w-3 h-3 text-primary/60" />
            {Math.floor(duration / 60)}min
          </span>
        </div>

        {/* Language flags */}
        {languages && languages.length > 0 && (
          <div className="flex flex-wrap items-center gap-0.5">
            {languages.map((lang, i) => {
              const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
              return match ? <span key={i} className="text-xs" title={match.name}>{match.flag}</span> : null;
            })}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-[11px] font-semibold rounded-full px-3 bg-gradient-tourism hover:shadow-tourism gap-1 shadow-sm shrink-0"
            disabled={isProcessingPayment}
            onClick={(e) => { e.stopPropagation(); handleView(); }}
          >
            {isProcessingPayment ? (
              <ButtonLoader text="..." />
            ) : (
              <>
                <Headphones className="h-3.5 w-3.5" />
                Listen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
