

## Plan: Fix 3 Issues (Build Error, Favicon, OG Images)

### Problem 1: Build Error
`AdminGuideOrderManager.tsx` line 275 calls `fetchGuides()` which is not in scope inside `SortableGuideRow`.

**Fix:** Add `onDelete` callback prop to `SortableGuideRow`, pass `fetchGuides` from parent.

### Problem 2: Favicon Not Showing
`FaviconUpdater.tsx` only sets favicon when `branding.faviconUrl` exists. If the database value is empty, no favicon is set and the browser may lose the default one.

**Fix:** Add fallback to `/logo-audio-tour-guides.png` when `branding.faviconUrl` is falsy.

### Problem 3: Social Media OG Images Not Showing
- `ShareLink.tsx` already correctly uses the edge function URL -- no changes needed there.
- `SocialShare.tsx` uses `window.location.href` as the share URL, which means crawlers hit the SPA and get generic OG tags instead of guide-specific ones.

**Fix:** Update `SocialShare.tsx` to accept a `guideId` and build the edge function URL (same pattern as `ShareLink.tsx`) when a guide is provided.

### Files to Change
1. `src/components/AdminGuideOrderManager.tsx` -- add `onDelete` prop, wire fetchGuides
2. `src/components/FaviconUpdater.tsx` -- add fallback favicon
3. `src/components/SocialShare.tsx` -- use edge function URL for guide sharing

### Access Links Impact
**No change to existing access links.** `buildAccessUrl` stays untouched. Only the social share URL generation changes, and the edge function redirects users to the exact same access URL.

