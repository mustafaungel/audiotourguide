

## Plan: iOS-Style Admin Panel + Performance Optimization

### Part 1: iOS-Style Segment Controls for Admin Panel

Replace the current `TabsList` with an iOS-style segmented control — a rounded pill container with sliding indicator animation.

**Changes in `src/pages/AdminPanel.tsx`:**
- Replace `<TabsList>` with a custom segmented control component using two buttons (Dashboard / Content) inside a rounded-full container with `bg-muted` background
- Add a sliding background indicator (`motion div` or CSS transition) that animates between the two segments
- On mobile, keep the same segment control instead of the dropdown `<Select>` — it's only 2 items, fits naturally

**Changes in `src/components/AdminMobileNavigation.tsx`:**
- Simplify to render the same iOS-style segment control (shared component or inline) instead of `<Select>` dropdown — two segments fit perfectly on mobile

**New file `src/components/ui/segmented-control.tsx`:**
- Reusable iOS-style segmented control with:
  - Rounded-full container with `bg-muted` padding
  - Active segment gets white/card background with subtle shadow and smooth `transition-all`
  - Haptic feedback on segment change (using existing `haptics.selection()`)
  - Icon + label support
  - `min-h-touch` for proper iOS touch targets

### Part 2: Performance Optimization (All Pages)

**A. Dashboard lazy-load collapsible content (`src/components/AdminDashboard.tsx`):**
- Wrap each collapsible section's component in a lazy render — only mount the component when the section is first opened (use `useState` to track which sections have been opened)
- This prevents 6 heavy components from mounting on dashboard load

**B. Homepage query optimization (`src/pages/Index.tsx`):**
- Change `select('*')` to `select('id, title, description, location, category, price_usd, image_urls, slug, is_featured, display_order, master_access_code')` — avoid fetching unnecessary columns (audio data, scripts, etc.)
- Add `staleTime` and use React Query (`useQuery`) instead of raw `useState`+`useEffect` for automatic caching between navigations

**C. Image optimization (`src/components/GuideCard.tsx` and `src/components/OptimizedImage.tsx`):**
- Add `loading="lazy"` and `decoding="async"` to all guide card images
- Add explicit `width`/`height` attributes to prevent layout shift

**D. AdminDashboard stats query optimization (`src/components/AdminDashboard.tsx`):**
- Change `select('*')` on audio_guides to `select('id')` — only need count
- Change `select('price_paid, purchase_date')` — already optimized, keep as is

### Files affected

| File | Change |
|------|--------|
| `src/components/ui/segmented-control.tsx` | New — iOS-style segmented control component |
| `src/pages/AdminPanel.tsx` | Replace TabsList with segmented control |
| `src/components/AdminMobileNavigation.tsx` | Replace Select with segmented control |
| `src/components/AdminDashboard.tsx` | Lazy-mount collapsibles, optimize stats query |
| `src/pages/Index.tsx` | Optimize Supabase select columns, use React Query |
| `src/components/GuideCard.tsx` | Add lazy loading/decoding to images |

