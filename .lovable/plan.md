

## Plan: Tüm Sayfalarda Layout Shift Düzeltmeleri — AudioGuideLoader Temalı

### Kapsam
GuideDetail + AudioAccess + Ortak bileşenler (OptimizedImage, GuideCard, FeaturedGuides)

---

### 1. `src/pages/GuideDetail.tsx` — Loading state'i AudioGuideLoader'a çevir

**Mevcut sorun**: Satır 577-651'de generic gri `animate-pulse` skeleton kullanılıyor.

**Yapılacak**:
- Mevcut grid yapısını koru (layout shift olmasın) ama iç skeleton'ları AudioGuideLoader temalı elementlere çevir:
  - Hero image alanı: `bg-muted` + ortada kulaklık ikonu + ses dalgası animasyonu (`audio-wave-bar`, `audio-icon-pulse` class'ları)
  - Sidebar ve info alanları: aynı min-h ile ama AudioGuideLoader'ın pulse/wave stilini kullansın
- Preview → gerçek veri geçişinde: `creator.name === ''` ise creator bölümünü gizle, `currentChapters.length === 0` ise chapters'ı gizle, `languages` boşsa `GuideLanguageSelector`'ı render etme

### 2. `src/pages/AudioAccess.tsx` — Image + layout stabilizasyonu

**Mevcut sorun**: 
- Satır 638: Image container'da `bg-muted` yok — görsel yüklenene kadar boş
- `GuideLanguageSelector` async yüklendiğinde kayma yaratıyor
- Loading state zaten `AudioGuideLoader variant="page"` kullanıyor ✓

**Yapılacak**:
- Satır 638 `div`'e `bg-muted` ekle
- `GuideLanguageSelector` zaten `availableLanguages.length < 1` ise `null` döndürüyor — bu yeterli, ek önlem olarak wrapper'a `min-h` eklenmeyecek (selector gizliyken yer kaplamasın)
- MultiTabAudioPlayer container'a (satır 693) `min-h-[200px]` ekle

### 3. `src/components/OptimizedImage.tsx` — Global bg-muted

**Yapılacak**: `img` elementinin `className`'ine `bg-muted` ekle — tüm kullanım noktalarında image yüklenene kadar gri placeholder

### 4. `src/components/GuideCard.tsx` — Image container bg

**Yapılacak**: Satır ~117 `aspect-video overflow-hidden` div'ine `bg-muted` ekle

### 5. `src/components/FeaturedGuides.tsx` — Carousel loading

**Yapılacak**: Mevcut loading skeleton'ı `AudioGuideLoader variant="card"` ile değiştir, carousel image container'larına `bg-muted` ekle

---

### Etkilenen Dosyalar
- `src/pages/GuideDetail.tsx` — AudioGuideLoader temalı skeleton + conditional gizleme
- `src/pages/AudioAccess.tsx` — bg-muted + min-h stabilizasyon
- `src/components/OptimizedImage.tsx` — bg-muted default
- `src/components/GuideCard.tsx` — image container bg
- `src/components/FeaturedGuides.tsx` — AudioGuideLoader + bg-muted

### Sonuç
- Tüm yükleme ekranları audio guide temasına uygun
- Preview → gerçek veri geçişinde sıfır layout shift
- Image yüklenirken sıfır kayma
- Hem mobil hem masaüstünde tutarlı deneyim

