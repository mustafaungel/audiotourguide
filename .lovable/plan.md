

## Görsel Domain Proxy + Performans İyileştirmeleri

### Sorun 1: Görseller Supabase Domain'inde

Guide görselleri `dsaqlgxajdnwoqvtsrqd.supabase.co` domain'inden sunuluyor. Google, sitemap'teki `<image:image>` etiketlerini yalnızca aynı domain'den kabul ediyor. OG/JSON-LD zaten Supabase URL'lerini kullanıyor — Google Image Search için bu görsellerin `audiotourguide.app` üzerinden sunulması gerekiyor.

**Çözüm: Edge Function ile Görsel Proxy**

Yeni bir `proxy-image` Edge Function oluşturulur. Bu fonksiyon Supabase storage'dan görseli alıp kendi domain'inden sunar.

- **`supabase/functions/proxy-image/index.ts`** — Supabase storage URL'ini alır, görseli fetch eder, doğru `Content-Type` header'ı ile döner. Cache-Control header'ı ekler (1 yıl).
- **`src/lib/url-utils.ts`** — Yeni `getProxiedImageUrl()` fonksiyonu: Supabase URL'lerini `https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/proxy-image?url=...` formatına çevirir.
- **SEO.tsx** — `image` prop'u proxy URL kullanır
- **GuideDetail.tsx** — `guideImage` (satır 649) proxy URL üzerinden OG tag ve JSON-LD'ye verilir
- **`public/sitemap.xml`** — Her guide URL'ine `<image:image><image:loc>` etiketi eklenir (proxy URL ile)

### Sorun 2: Performans Problemleri

Kod incelemesinde tespit edilen sorunlar:

**A. GuideDetail Request Waterfall (En Büyük Sorun)**

`fetchGuideDetails()` tamamlandıktan sonra sırayla:
1. `fetchLinkedGuides()` çağrılıyor (await ile)
2. `fetchRelatedGuides()` çağrılıyor (await ile)
3. `detectAndSetLanguage()` ayrı bir useEffect'te çağrılıyor
4. `checkPurchaseStatus()` ayrı bir useEffect'te çağrılıyor

Bu 4 istek seri olarak çalışıyor. Paralel çalışmalı.

**Çözüm:** `fetchGuideDetails` içinde `fetchLinkedGuides` ve `fetchRelatedGuides`'ı `Promise.all` ile paralel çağır. `detectAndSetLanguage` ve `checkPurchaseStatus`'u da aynı useEffect'te paralel başlat.

**B. OptimizedImage — Render/Image Transformation Fallback**

`getOptimizedImageUrl` fonksiyonu Supabase Image Transformation endpoint'ini kullanıyor (`/storage/v1/render/image/...`). Free tier'da bu endpoint çalışmıyor — her görsel önce 404/error alıyor, sonra `onError` ile orijinal URL'e düşüyor. Bu **her görsel için 2x network request** demek.

**Çözüm:** Supabase Image Transformation kullanmayı bırak, doğrudan orijinal URL'i kullan. Optimizasyon gerekirse proxy Edge Function'da resize yapılır.

**C. FeaturedGuides Bileşeni — Duplicate Fetch**

`FeaturedGuides.tsx` kendi `useEffect` + `fetchGuides()` ile ayrı bir Supabase sorgusu yapıyor. Ana sayfa zaten `homepage-guides` query'si ile aynı veriyi çekiyor. Gereksiz duplicate istek.

**Çözüm:** `FeaturedGuides`'a `guides` prop olarak dışarıdan ver, kendi fetch'ini kaldır.

**D. Demo Data — 1161 Satırlık GuideDetail**

`GuideDetail.tsx` içinde hardcoded demo `guideData` ve `reviews` (satır 29-105) hiç kullanılmıyor ama chunk boyutunu büyütüyor.

**Çözüm:** Bu dead code'u kaldır.

**E. Index.tsx Static Imports**

`src/assets/` altındaki 6 görsel (cappadocia, istanbul, machu-picchu vb.) eager import ediliyor ama kodda kullanılmıyor — guide görselleri Supabase'den geliyor.

**Çözüm:** Kullanılmayan static import'ları kaldır.

### Degisiklik Listesi

```
Yeni dosya:
  supabase/functions/proxy-image/index.ts — görsel proxy

Düzenlenen dosyalar:
  src/lib/url-utils.ts — getProxiedImageUrl() ekle, getOptimizedImageUrl() basitleştir
  src/components/OptimizedImage.tsx — transformation URL yerine direkt URL kullan
  src/components/SEO.tsx — proxy image URL desteği
  src/pages/GuideDetail.tsx — parallel requests, dead code kaldır, proxy image SEO
  src/pages/Index.tsx — kullanılmayan asset import'ları kaldır
  src/components/FeaturedGuides.tsx — prop-based data, kendi fetch'i kaldır
  public/sitemap.xml — image:image etiketleri ekle
```

### Beklenen İyileşme

- GuideDetail açılış süresi: ~40% hızlanma (waterfall → parallel)
- Görsel yükleme: ~50% hızlanma (2x request → 1x request)
- Bundle boyutu: ~5-10KB küçülme (dead code + unused imports)
- SEO: Google Image Search'te guide görselleri indexlenebilir

