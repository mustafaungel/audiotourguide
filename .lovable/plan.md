

## 🎯 Mobil Hız İyileştirme — Tam Plan (3 Sprint, 10 Adım)

> **Garanti**: Audio player akışı, ses yükleme/oynatma mantığı, dil değişimi, MediaSession API, mini/expanded player — **HİÇBİRİNE dokunulmayacak**. Sadece yükleme/render/asset katmanı optimize edilecek.

---

### 🟢 Sprint 1 — En Yüksek Etki / Sıfır Risk (4 değişiklik)

#### A. Hero LCP Optimizasyonu
**Dosyalar**: `src/components/HeroSection.tsx`, `index.html`
- `<img>`'a `fetchPriority="high"` ekle (zaten `loading="eager"`)
- `index.html`'e `<link rel="preload" as="image">` ekle (Vite hash'li URL'i otomatik çözer; eklenecek path strateji ile uyumlu)
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: -200~300ms LCP

#### B. FeaturedGuides Sorgu Slim
**Dosya**: `src/components/FeaturedGuides.tsx`
- `select('*')` → sadece kart için gereken kolonlar:
  `'id, title, slug, description, location, category, difficulty, duration, price_usd, image_url, rating, total_reviews, languages'`
- `audio_url`, `transcript`, `sections`, `image_urls` çekilmeyecek (kart bunları kullanmıyor)
- **Ses ile ilgisi**: 0 — homepage kart sorgusu, audio player'ın kendi sorgusuyla **ilgisiz**
- **Beklenen kazanç**: -100~500KB API payload

#### C. Index Sorgu Limit
**Dosya**: `src/pages/Index.tsx`
- Mevcut sorguya `.limit(24)` (UI 6'şarlı load-more kullanıyor, 24 yeterli buffer)
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: Büyük listede -200KB

#### D. Lora Font Conditional Loading
**Dosyalar**: `index.html`, `src/components/ExpandedPlayer.tsx`
- `index.html`'den Lora `<link>` etiketini kaldır
- `ExpandedPlayer.tsx` mount olduğunda dinamik enjeksiyon (idempotent)
- **Ses ile ilgisi**: 0 — sadece görsel font; player oynatma mantığına **dokunulmuyor**
- **Beklenen kazanç**: Tüm sayfalarda -50KB transfer

---

### 🟡 Sprint 2 — Orta Etki / Sıfır Risk (3 değişiklik)

#### E. `will-change` Temizliği (Statik Sticky'lerden)
**Dosyalar**: `src/components/Navigation.tsx`, `src/pages/GuideDetail.tsx`, `src/pages/AudioAccess.tsx`
- Sticky header'lardaki **kalıcı** `will-change-transform transform-gpu` çiftlerini kaldır.
- **DOKUNULMAYACAK**: `ExpandedPlayer.tsx` (gerçek translate-y animasyonu var), `ThemeToggle.tsx` (knob animasyonu)
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: GPU memory ~20-40MB azalma

#### F. Footer Lazy-Load
**Dosyalar**: Footer kullanan tüm sayfalar (Index, Guides, CountryDetail, FeaturedGuides, Countries)
- `React.lazy` + `<Suspense fallback={null}>`
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: Initial bundle -5KB, FCP -50ms

#### G. Görsel Boyut Attribute'ları (CLS Önleme)
**Dosya**: `src/components/GuideCard.tsx`
- `<OptimizedImage>` çağrılarına `width={400} height={225}` ekle (16:9, zaten props destekleniyor)
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: CLS iyileşir

---

### 🟠 Sprint 3 — Düşük Risk / Bundle Optimizasyon (3 değişiklik)

#### H. Lucide-React Chunk Split
**Dosya**: `vite.config.ts`
- `manualChunks` içine `'vendor-icons': ['lucide-react']` ekle
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: 158KB ayrı cache, paralel indirme

#### I. PerformanceMonitor Idle-Defer
**Dosya**: `src/components/PerformanceMonitor.tsx`
- `PerformanceObserver` setup'larını `requestIdleCallback` (fallback `setTimeout(..., 1)`) içine sar
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: TTI -30~50ms

#### J. FaviconUpdater Idle-Defer
**Dosya**: `src/components/FaviconUpdater.tsx`
- DOM manipülasyonunu `requestIdleCallback` ile geciktir
- **Ses ile ilgisi**: 0
- **Beklenen kazanç**: TTI -20ms

---

## 🛡 Audio Güvenlik Garantisi (Açık Dokunulmazlar)

- ❌ `useAudioPlayer.ts`, `useAudioPreload.ts`, `useAudioProgress.ts`, `useAudioSource.ts`, `useInvisibleAudioPlayer.ts`, `useLibraryAudio.ts`, `useSpotifyAudio.ts`
- ❌ `AudioPlayer.tsx`, `EnhancedAudioPlayer.tsx`, `MiniPlayer.tsx`, `ExpandedPlayer.tsx` (Sprint 1-D **sadece font ekliyor**)
- ❌ `NewSectionAudioPlayer.tsx`, `SectionAudioPlayer.tsx`, `MultiTabAudioPlayer.tsx`, `FloatingAudioPlayer.tsx`
- ❌ `LibraryAudioPlayer.tsx`, `SpotifyStylePlayer.tsx`, `AudioPreviewPlayer.tsx`
- ❌ MediaSession API, autoplay flow, language switching, storage URL resolution, mobile gesture logic

---

## 🔄 Doğrulama Akışı (Her Sprint Sonrası)

1. Build/TypeScript kontrolü
2. Görsel regresyon screenshot
3. Console hata kontrolü
4. `browser--performance_profile` öncesi/sonrası kıyas
5. **Audio smoke test** — sizden manuel onay isterim
6. Regresyon varsa → **revert**

---

## ⏱ Uygulama Sırası

1. **Sprint 1** (A→B→C→D) → ölç → onayını al
2. **Sprint 2** (E→F→G) → ölç → onayını al
3. **Sprint 3** (H→I→J) → ölç → final rapor

Her sprint sonu **dur, ölç, raporla, onay bekle**.

---

## 📊 Toplam Beklenen Kazanç

| Metrik | Şu an | Hedef |
|---|---|---|
| FCP (anasayfa) | 1948ms | **~1400ms** (-28%) |
| LCP | ~2200ms | **~1700ms** (-23%) |
| Layout count (/guides) | 1438 | **~1100** (-23%) |
| API payload (homepage) | ~600KB+ | **~150KB** (-75%) |
| Mobile GPU memory | baseline | -20~40MB |

---

## ⚠ Önemli Not
Plan 10 değişiklik içerir ama **her sprint bağımsızdır**. Bir sprint reddedilirse diğerleri etkilenmez. Onayınızdan sonra **Sprint 1'den** başlarım, her sprint sonu ✅ beklerim.

