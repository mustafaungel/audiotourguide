

## Analiz Sonuçları

### Kritik SEO Sorunu: Yanlış Domain
Kodun büyük bir kısmı hala eski `guided-sound-ai.lovable.app` domain'ini kullanıyor. Gerçek domain `audiotourguide.app`. Bu, Google'ın sitenizi doğru indexlememesinin **ana sebebi**.

**Etkilenen dosyalar (143+ yanlış URL):**
- `src/components/SEO.tsx` — siteUrl olarak `guided-sound-ai.lovable.app` kullanıyor
- `src/pages/Index.tsx` — structured data ve canonical URL'ler
- `src/pages/Guides.tsx` — canonical URL ve breadcrumb
- `src/pages/Countries.tsx` — canonical URL ve breadcrumb
- `src/pages/CountryDetail.tsx` — canonical URL ve breadcrumb
- `src/pages/GuideDetail.tsx` — canonical URL, breadcrumb, hreflang
- `public/robots.txt` — sitemap URL'leri yanlış domain'e işaret ediyor
- `public/sitemap.xml` — tüm URL'ler yanlış domain
- `supabase/functions/generate-sitemap/index.ts` — baseUrl yanlış

### Google Search Console Doğrulama Eksik
`google-site-verification` meta tag'i `index.html`'de yok. Google Search Console'a siteyi eklemek ve doğrulamak için bu gerekli.

### Favicon Cache Sorunu
`BrandingContext` favicon'u `localStorage` key'i `site_branding_cache` ile cache'liyor. Eğer database'de favicon URL boşsa, cache'deki eski değer kullanılıyor olabilir.

---

## Uygulama Planı

### Adım 1: Tüm URL'leri `audiotourguide.app`'e güncelle
- `src/components/SEO.tsx` — `siteUrl` değişkenini `https://audiotourguide.app` yap
- `src/pages/Index.tsx` — structured data URL'lerini güncelle
- `src/pages/Guides.tsx` — canonical ve breadcrumb URL'lerini güncelle
- `src/pages/Countries.tsx` — aynı şekilde
- `src/pages/CountryDetail.tsx` — aynı şekilde
- `src/pages/GuideDetail.tsx` — aynı şekilde
- `public/robots.txt` — sitemap URL'lerini `audiotourguide.app` olarak güncelle
- `public/sitemap.xml` — tüm URL'leri güncelle
- `supabase/functions/generate-sitemap/index.ts` — baseUrl'i güncelle

### Adım 2: Google Search Console verification tag ekle
- `index.html`'e `<meta name="google-site-verification" content="...">` ekle
- (Kullanıcıdan verification kodunu almam gerekecek)

### Adım 3: Favicon cache temizliğini otomatikleştir
- `FaviconUpdater.tsx`'te cache-busting ekle (timestamp query param)
- `BrandingContext`'te cache versiyonu ekleyerek eski cache'lerin otomatik geçersiz kılınmasını sağla

### Adım 4: Edge function sitemap'i redeploy et
- `generate-sitemap` fonksiyonundaki baseUrl düzeltmesi sonrası redeploy gerekecek

---

## SEO Özeti

| Sorun | Etki | Durum |
|-------|------|-------|
| Yanlış domain (143+ URL) | Google yanlış siteyi indexliyor | Kritik |
| Google verification eksik | Search Console kullanılamıyor | Yüksek |
| robots.txt yanlış sitemap | Google sitemap bulamıyor | Yüksek |
| Favicon cache | Tarayıcıda logo gözükmüyor | Orta |

**Sonuç:** "cappadocia audio guide" gibi aramalarla bulunamamanızın ana sebebi, tüm canonical URL'lerin, sitemap'lerin ve structured data'nın yanlış domain'e (`guided-sound-ai.lovable.app`) işaret etmesi. Bu düzeltilince ve Google Search Console'a doğru domain eklendikten sonra, indexleme başlayacaktır.

