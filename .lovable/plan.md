

## Supabase Linklerini Sitemap'ten Kaldırma

### Sorun
Sitemap'teki `<image:loc>` etiketlerinde Supabase Storage URL'leri (`https://dsaqlgxajdnwoqvtsrqd.supabase.co/...`) bulunuyor. Google bu görselleri farklı domain olarak görüyor ve sitemap doğrulamasında sorun çıkarabiliyor.

### Çözüm
Tüm `<image:image>` bloklarını sitemap'ten kaldır. Google zaten guide sayfalarındaki `<meta property="og:image">` ve JSON-LD structured data üzerinden görselleri keşfedip indexliyor. Sitemap'te image tag'i zorunlu değil.

### Değişiklik

**`public/sitemap.xml`**: Her guide URL'sindeki `<image:image>...</image:image>` bloklarını tamamen sil. Sadece `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>` kalsın.

Ayrıca **`supabase/functions/generate-sitemap/index.ts`** edge function'ındaki image section üretim kodunu da kaldır — böylece ileride sitemap yeniden oluşturulursa Supabase linkleri tekrar eklenmez.

