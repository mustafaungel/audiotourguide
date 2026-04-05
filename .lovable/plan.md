

## Plan: Mobil Kaydırma Titremesi & Başlık Kısaltma Düzeltmesi

### Sorun
1. **Mobilde en alta kaydırınca sekme/titreme**: iOS ve Android'de `overscroll bounce` efekti sayfa içeriğini sallıyor. `min-h-screen` + sticky navbar + blur background kombinasyonu bunu kötüleştiriyor.
2. **Başlık kısaltması (truncate)**: Navbar'daki `truncate` class'ı uzun guide başlıklarını "..." ile kesiyor.
3. **Hero bölümündeki `blur-3xl` + `scale-110`**: Mobilde GPU-intensive, kaydırma sırasında jank yaratıyor.

### Değişiklikler

#### 1. `src/index.css` — Overscroll bounce'u engelle
```css
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}
```
Bu, tüm sayfalarda (AudioAccess dahil) en üst/alt kaydırmada rubber-band bounce'u kapatır.

#### 2. `src/pages/AudioAccess.tsx` — Navbar başlık kısaltmasını kaldır + blur optimizasyonu

- Navbar'daki `truncate` class'ını kaldır, yerine `line-clamp-2 text-center break-words` koy. Böylece uzun başlıklar 2 satıra kadar görünür, hiçbir şey kesilmez.
- Navbar yüksekliğini `h-12` → `min-h-12 h-auto py-1` yap (2 satırlık başlığa uyum).
- Hero'daki `blur-3xl scale-110` background div'ine `will-change-transform` zaten var; ek olarak mobilde blur yoğunluğunu `blur-2xl` olarak düşür veya `@media (prefers-reduced-motion)` ile tamamen kapat.
- Tüm sayfayı `overscroll-behavior-y: none` ile wrap et (CSS'teki global rule bunu karşılar).

#### 3. `src/pages/AudioAccess.tsx` — Genel title/description okunabilirliği
- Hero altındaki description'daki `line-clamp-2` default'unu koruyarak ama "Show more" butonunu her zaman göstererek kullanıcıya kontrol ver.
- Metadata satırındaki yazılar `whitespace-nowrap` olmamalı, gerekirse wrap olabilmeli.

### Etkilenen Dosyalar
- `src/index.css` — overscroll-behavior ekleme (2 satır)
- `src/pages/AudioAccess.tsx` — navbar truncate kaldır, blur azalt, title wrap

