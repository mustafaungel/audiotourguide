

## Görsel Yükleme Sorunu - Analiz ve Çözüm

### Sorun
`getDirectImageUrl()` fonksiyonu tüm Supabase Storage URL'lerini `cdn.audiotourguide.app` üzerinden yönlendiriyor. CDN curl ile çalışıyor ancak Lovable preview iframe'inde görseller yüklenmiyor olabilir (SSL propagation gecikmesi veya iframe kısıtlamaları).

### Plan

1. **Yayınlanmış siteyi test et** — `https://audiotourguide.app` üzerinde görsellerin görünüp görünmediğini `curl` ve browser ile kontrol et
2. **CDN erişimini browser'dan test et** — Doğrudan bir CDN görsel URL'sini browser'da aç
3. **Fallback ekle** — Eğer CDN görselleri yüklenemezse, `OptimizedImage` bileşenine orijinal Supabase URL'sine geri dönme mekanizması ekle

### Teknik Detay

**`src/components/OptimizedImage.tsx`** — `onError` durumunda CDN URL yerine orijinal Supabase URL'sini dene:

```tsx
// getDirectImageUrl yerine, hem CDN hem fallback URL üret
const cdnUrl = getDirectImageUrl(src);
const fallbackUrl = src; // orijinal Supabase URL

onError handler'da:
- İlk hata → fallbackUrl'i dene
- İkinci hata → placeholder göster
```

Bu sayede CDN çalışmadığında bile görseller doğrudan Supabase'den yüklenir.

### Adımlar
1. `curl` ile CDN görsel URL'sini browser context'inde test et
2. `OptimizedImage.tsx`'e fallback mekanizması ekle
3. Preview'da görsellerin düzeldiğini doğrula

