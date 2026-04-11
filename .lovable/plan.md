

## Sitemap Güncelleme — Eksik Guide Ekleme

### Sorun

`public/sitemap.xml` dosyasında **Grand Bazaar Audio Guide** eksik. Bu guide veritabanında `is_published=true` ve `is_approved=true` olmasına rağmen sitemap'e eklenmemiş.

### Görseller Hakkında

Sitemap'te `<image:image>` etiketi kasıtlı olarak kullanılmıyor. Supabase storage URL'leri (`dsaqlgxajdnwoqvtsrqd.supabase.co`) ana domain (`audiotourguide.app`) ile farklı olduğu için Google cross-domain sitemap görsellerini reddediyor. Görseller zaten her sayfanın OG meta etiketleri ve JSON-LD structured data'sı üzerinden Google tarafından indexleniyor — ek aksiyon gerekmiyor.

### Degisiklik

**`public/sitemap.xml`** — Grand Bazaar guide'ını ekle:

```xml
<url>
  <loc>https://audiotourguide.app/guide/grand-bazaar-audio-guide-istanbul-turkey</loc>
  <lastmod>2026-04-10</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

Guide Detail Pages bölümünün başına (en güncel olduğu için) eklenir.

### Teknik Özet

```
1 dosya: public/sitemap.xml — 1 yeni URL eklenir
```

