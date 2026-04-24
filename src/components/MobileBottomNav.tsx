import { Headphones, Home, LogIn, MapPinned, LibraryBig } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { smoothScrollTo } from "@/lib/scroll-memory";
import { useAuth } from "@/contexts/AuthContext";

const baseNavItems = [
  { to: "/", label: "Discover", icon: Home, match: (pathname: string) => pathname === "/" },
  { to: "/guides", label: "Guides", icon: Headphones, match: (pathname: string) => pathname.startsWith("/guides") || pathname.startsWith("/guide/") },
  { to: "/country", label: "Places", icon: MapPinned, match: (pathname: string) => pathname.startsWith("/country") || pathname.startsWith("/featured-guides") },
];

const hiddenRoutes = ["/admin", "/access/"];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (hiddenRoutes.some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  const navItems = user
    ? [...baseNavItems, { to: "/library", label: "Library", icon: LibraryBig, match: (pathname: string) => pathname.startsWith("/library") || pathname.startsWith("/payment-") }]
    : baseNavItems;

  const accountItem = user
    ? { to: "/library", label: "Account", icon: LogIn, match: (pathname: string) => pathname.startsWith("/library") }
    : { to: "/admin-login", label: "Sign In", icon: LogIn, match: (pathname: string) => pathname.startsWith("/admin-login") };

  const items = [...navItems, accountItem];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none">
      <div className="mobile-container pb-safe pt-2.5">
        <div className={cn("pointer-events-auto mobile-bottom-nav-shell", items.length === 4 && "mobile-bottom-nav-shell-guest")}>
          {items.map((item) => {
            const isActive = item.match(location.pathname);
            const Icon = item.icon;

            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                onClick={(e) => {
                  // If already on the same route, smooth-scroll to top instead of re-navigating.
                  if (location.pathname === item.to) {
                    e.preventDefault();
                    smoothScrollTo(0);
                  }
                }}
                className={cn(
                  "mobile-bottom-nav-item",
                  isActive && "mobile-bottom-nav-item-active",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={cn("mobile-bottom-nav-icon-wrap", isActive && "mobile-bottom-nav-icon-wrap-active")}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="mobile-bottom-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};