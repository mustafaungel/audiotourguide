

## CSS-Only 3D Derinlik Tasarım Yükseltmesi

Performans kaybı sıfır — tamamı CSS `transform`, `box-shadow` ve `backdrop-filter` ile yapılacak. WebGL veya ağır JS kütüphanesi yok.

### 1. Kartlara Çok Katmanlı Shadow + Hover 3D Transform

**Dosya:** `src/components/GuideCard.tsx`

- Kart wrapper'a `perspective` ve hover'da `rotateX(-2deg) rotateY(2deg) translateZ(4px)` eklenir
- Çok katmanlı shadow: `shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.04)]`
- Hover'da shadow derinleşir + hafif yukarı kalkar
- `transform-style: preserve-3d` ve `will-change: transform` ile GPU hızlandırması

### 2. Hero Section'a Parallax Depth Katmanları

**Dosya:** `src/components/HeroSection.tsx`

- Arka plan görseli, gradient overlay ve content'e farklı `translateZ` değerleri verilir
- Section'a `perspective: 1000px` eklenir
- Scroll'a bağlı parallax yerine CSS-only depth (z-katmanları) — performans güvenli
- Dekoratif ses dalgası çizgilerine hafif `translateZ(-20px)` ile geri plan derinliği

### 3. Butonlara Pressed/Raised Efekti (Neumorphism-lite)

**Dosya:** `src/index.css` (yeni utility class'lar)

- `.btn-raised`: Çift shadow (üst: aydınlık, alt: gölge) ile yüzeyden yükselmiş görünüm
- `active` state'te shadow tersine döner (iç gölge) + `translateY(1px)` — basılma hissi
- Hero ve tourism buton varyantlarına uygulanır

**Dosya:** `src/components/ui/button.tsx`

- `hero`, `tourism`, `audio` varyantlarına raised shadow + active pressed efekti eklenir

### 4. Badge'lere Glassmorphism + Inner Shadow

**Dosya:** `src/index.css`

- `.glass-badge`: `backdrop-blur-xl`, yarı-saydam arka plan, `inset 0 1px 0 rgba(255,255,255,0.15)` üst kenar parlama, `inset 0 -1px 2px rgba(0,0,0,0.1)` alt iç gölge
- Dark mode'da opaklık değerleri ayarlanır

**Dosya:** `src/components/LiveListenersBadge.tsx`

- Mevcut badge'e `glass-badge` class'ı uygulanır

**Dosya:** `src/components/GuideCard.tsx`

- Kategori badge'ine glassmorphism eklenir

### 5. Genel Shadow Sistemi Güncelleme

**Dosya:** `src/index.css` (CSS variables)

- `--shadow-card` → 3 katmanlı shadow'a güncellenir
- `--shadow-elevated` → 4 katmanlı shadow'a güncellenir
- Yeni `--shadow-raised` ve `--shadow-pressed` değişkenleri eklenir

### Performans Garantisi

- Tüm efektler `transform` ve `opacity` — layout/paint tetiklemez
- `will-change: transform` sadece hover/active state'lerde
- `prefers-reduced-motion` media query ile animasyonlar devre dışı bırakılabilir
- Backdrop-blur sadece küçük, statik alanlarda (badge'ler) — scroll performansı etkilenmez

### Etkilenen Dosyalar (5 dosya)

1. `src/index.css` — Yeni utility class'lar ve shadow variables
2. `src/components/GuideCard.tsx` — 3D hover transform + çok katmanlı shadow
3. `src/components/HeroSection.tsx` — Depth katmanları
4. `src/components/ui/button.tsx` — Raised/pressed efekti
5. `src/components/LiveListenersBadge.tsx` — Glass badge

