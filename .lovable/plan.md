## Mobil Performans İyileştirme — Uygulama Planı

### A) KeepAlive Pattern (App.tsx)
- Ana tab sayfaları (`Index`, `Guides`, `Library`, `Country`) DOM'dan kaldırılmayacak
- `display: none` ile gizlenecek, mount edilmiş halde tutulacak
- Detay sayfaları (`/guide/:slug`, `/access/:guideId`, `/admin`, `/auth` vb.) normal mount/unmount
- Sonuç: Tab geçişleri 0ms, scroll & state korunur, veri tekrar fetch edilmez

### B) GuideCard görsel optimizasyonu
- `decoding="async"` eklenecek
- İlk 6 kart için `fetchpriority="high"` + `loading="eager"`
- Diğerleri `loading="lazy"`
- `OptimizedImage` bileşeninde `fetchpriority` prop'u desteklenecek

### C) Global fade animasyonunu kaldır (index.css)
- `#main-content > *` üzerindeki `route-fade-in` animasyonu kaldırılacak
- Her navigasyonda forced repaint sebebi → kasma kaynağı

### D) Bottom nav davranışı (mevcut)
- `navigate(-1)` davranışı korunur, KeepAlive sayesinde anında olur

### Dosyalar
- `src/App.tsx` — KeepAlive route yapısı
- `src/components/GuideCard.tsx` — fetchpriority/eager hint'leri
- `src/components/OptimizedImage.tsx` — fetchpriority prop desteği
- `src/index.css` — global fade kaldır
