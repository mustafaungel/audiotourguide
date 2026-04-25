import { useNavigate } from "react-router-dom";
import { Headphones, MapPinned } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface ExploreSegmentedNavProps {
  /** Which tab is active */
  active: "guides" | "places";
  className?: string;
}

/**
 * iOS-style segmented control shown at the top of the Guides and Countries
 * pages. Both routes are KeepAlive tabs in App.tsx, so switching is instant
 * and preserves scroll/state.
 */
export const ExploreSegmentedNav = ({ active, className }: ExploreSegmentedNavProps) => {
  const navigate = useNavigate();

  return (
    <div className={`mobile-container flex justify-center pt-4 pb-2 ${className ?? ""}`}>
      <SegmentedControl
        items={[
          { value: "guides", label: "Guides", icon: Headphones },
          { value: "places", label: "Places", icon: MapPinned },
        ]}
        value={active}
        onValueChange={(val) => {
          if (val === active) return;
          navigate(val === "guides" ? "/guides" : "/country");
        }}
        className="w-full max-w-xs"
      />
    </div>
  );
};
