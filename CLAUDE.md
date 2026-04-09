# Audio Tour Guide

## Project Overview
AI-powered audio tour guide marketplace. Users browse/purchase audio guides for cities and landmarks. Admins create guides with AI-generated scripts, descriptions, images, and text-to-speech audio.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite (SWC)
- **Styling:** Tailwind CSS + shadcn/ui (Radix)
- **Routing:** React Router v6 (lazy-loaded routes)
- **State:** TanStack React Query (5min stale time)
- **Auth/DB:** Supabase (Auth + PostgreSQL + Edge Functions + Storage)
- **Payments:** Stripe (checkout sessions)
- **AI:** OpenAI (DALL-E 3, GPT-4o-mini), ElevenLabs (TTS)
- **Email:** Resend + React Email templates
- **Themes:** next-themes (dark/light)

## Commands
```bash
npm run dev      # Dev server on port 8080
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Project Structure
```
src/
  pages/          # Route pages (Index, GuideDetail, AudioAccess, AdminPanel, Library, etc.)
  components/     # Feature components (audio players, admin, payments, guides)
  components/ui/  # shadcn/ui primitives (do not edit manually)
  contexts/       # AuthContext, BrandingContext
  hooks/          # useAudioPlayer, useIsAdmin, useViralTracking, etc.
  services/       # logoGenerationService
  data/           # constants (languages, countries)
  integrations/   # Supabase client + types
  utils/          # networkUtils, backgroundRemoval
supabase/
  functions/      # Edge functions (payments, AI generation, email, etc.)
public/           # Static assets
```

## Routes
```
/                      → Homepage (featured guides, stats)
/guides                → Browse all guides
/guide/:slug           → Guide detail + purchase
/access/:guideId       → Audio player (post-purchase)
/library               → User's purchased guides
/country               → Browse by country
/country/:countrySlug  → Country-specific guides
/featured-guides       → Featured guides
/admin-login           → Auth page
/admin                 → Admin panel
/payment-success       → Post-payment confirmation
/payment-cancelled     → Payment cancelled
```

## Key Patterns
- All routes lazy-loaded except Index (eager for fast initial render)
- GuideDetail chunk preloaded 1s after initial load
- Admin check via Supabase RPC `is_admin()`
- Branding (logo, favicon, company name) cached in localStorage
- Audio players: multiple variants (Spotify-style, mini, expanded, floating)
- Path alias: `@/*` maps to `./src/*`

## Environment Variables
```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
```

## Supabase Edge Functions
- **Payments:** create-payment, create-payment-intent, verify-payment, get-stripe-key
- **AI Generation:** generate-audio (ElevenLabs), generate-description, generate-image (DALL-E), generate-script, generate-logo
- **Email:** send-confirmation-email, send-contact-email, test-email-system
- **Admin:** admin-create-user, admin-resend-email
- **Other:** generate-qr-code, generate-sitemap, track-viral-engagement, create-guide

## Conventions
- Lovable-generated project - Lovable also pushes to this repo
- shadcn/ui components in src/components/ui/ (auto-generated, don't edit)
- Build chunks named with `-v3` suffix
- Sonner for toast notifications
