

## Plan: Ana Sayfa Guide Tıklama + Layout Shift Düzeltmeleri

### Sorun 1: Ana sayfa carousel'inde guide'a tıklayınca sayfa açılmıyor
`src/components/FeaturedGuides.tsx` satır 58-60: `handleGuideClick` sadece `await trackEngagement('view', guideId)` çağırıyor — **navigate yok**. "Explore Guide" butonu tıklandığında hiçbir yere gitmiyor.

### Sorun 2: FeaturedGuides sayfasında guidePreview geçilmiyor
`src/pages/FeaturedGuides.tsx` satır 162: `navigate('/guide/${guide.id}')` — state geçmiyor. GuideDetail `isLoading: true` ile açılıp AudioGuideLoader gösteriyor (gereksiz bekleme).

### Sorun 3: Layout shift / titreme
GuideDetail sayfası `guidePreview` ile render olduğunda bazı alanlar eksik (creator: "Loading...", sections: [], languages: []). Tam veri geldiğinde bu alanlar dolunca sayfa kayıyor.

---

### Değişiklik 1: `src/components/FeaturedGuides.tsx`
- `useNavigate` import et
- `handleGuideClick`'i güncelle: `await` kaldır (fire-and-forget), `navigate` ekle
- Guide verilerini `guidePreview` state olarak geçir (id, title, description, location, price_usd → price, duration, category, difficulty, image_url → imageUrl)
- Kart'ın kendisine de `onClick` ile navigate ekle (sadece buton değil, tüm kart tıklanabilir olsun)

### Değişiklik 2: `src/pages/FeaturedGuides.tsx`
- Satır 162'deki `navigate` çağrısına `guidePreview` state ekle
- Guide verilerini (id, title, description, location, price_usd, duration, category, difficulty, image_url) state olarak geçir

### Değişiklik 3: `src/pages/GuideDetail.tsx` — Layout shift düzeltme
- Loading state render'ında (`isLoading` true) ve ana içerik render'ında **aynı layout yapısını** kullan
- Loading durumunda Navigation + Back button + aynı grid yapısı (lg:grid-cols-3) içinde skeleton göster
- Bu sayede loading → içerik geçişinde layout kayması olmaz
- `guidePreview` ile render olduğunda eksik alanları (creator, sections vb.) göstermek yerine, bu alanlar için skeleton/placeholder kullan — tam veri gelince değişsin
- `min-h` değerleri ekleyerek hero image, başlık ve fiyat alanlarının yüksekliğini sabitle

### Etkilenen Dosyalar
- `src/components/FeaturedGuides.tsx` — navigate ekleme + fire-and-forget tracking
- `src/pages/FeaturedGuides.tsx` — guidePreview state ekleme
- `src/pages/GuideDetail.tsx` — layout shift düzeltme (loading ve içerik aynı grid yapısı)

### Risk
Düşük. Tracking fire-and-forget olarak çalışmaya devam eder. Layout değişikliği sadece CSS/yapısal.

