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
      className="group flex gap-3 p-3 rounded-xl border border-border/30 bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer active:scale-[0.98]"
      onClick={handleView}
    >
      {/* Image — square thumbnail */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden">
        <OptimizedImage
          src={imageUrl}
          alt={title}
          width={128}
          height={128}
          quality={75}
          loading={imageLoading}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Category badge on image */}
        <Badge className={`absolute top-1.5 left-1.5 ${getCategoryColor(category)} text-[9px] font-medium px-1.5 py-0 capitalize`}>
          {category}
        </Badge>
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Content — right side */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{title}</h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{location}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {Math.floor(duration / 60)} min
          </span>
        </div>

        {/* Language flags */}
        {languages && languages.length > 0 && (
          <div className="flex flex-wrap items-center gap-0.5 mt-1">
            {languages.map((lang, i) => {
              const match = ELEVENLABS_LANGUAGES.find(l => l.name === lang || l.code === lang);
              return match ? <span key={i} className="text-xs" title={match.name}>{match.flag}</span> : null;
            })}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-bold">${(price / 100).toFixed(2)}</span>
          <Button
            variant="default"
            size="sm"
            className="ml-auto h-7 text-[11px] font-medium rounded-full px-3 bg-gradient-tourism hover:shadow-tourism gap-1"
            disabled={isProcessingPayment}
            onClick={(e) => { e.stopPropagation(); handleView(); }}
          >
            {isProcessingPayment ? (
              <ButtonLoader text="..." />
            ) : (
              <>
                <Headphones className="h-3 w-3" />
                Listen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
