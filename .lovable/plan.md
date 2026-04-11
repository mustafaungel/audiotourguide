

## Sitemap Temizligi + SEO Alt Text Optimizasyonu

### Sorun

Sitemap'te `<image:image>` etiketlerindeki URL'ler `dsaqlgxajdnwoqvtsrqd.supabase.co` domain'ine isaret ediyor. Google bu URL'leri kesfedip Supabase domain'ini indexleyebilir. Ana domain disinda hicbir sey indexlenmemeli.

Ayrica gorsel alt text'lerinde "Audio Guide" keyword'u yok — Google Image SEO icin eksik.

### Degisiklikler

**1. `public/sitemap.xml`**
- Tum `<image:image>...</image:image>` bloklarini kaldir
- Sadece `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>` kalsin
- Google gorselleri zaten sayfa icindeki OG tag'lerden ve JSON-LD'den indexliyor

**2. `src/components/GuideCard.tsx`**
- `alt={title}` → `alt={\`${title} - Audio Guide\`}`

**3. `src/pages/GuideDetail.tsx`**
- Ana gorsel alt text'e "Audio Guide" ekle

**4. `src/components/SEO.tsx`**
- `<meta property="og:image:alt" content={fullTitle} />` ekle

### Teknik Ozet

```
4 dosya:
  public/sitemap.xml — image:image etiketleri kaldir (cross-domain URL'ler)
  GuideCard.tsx — alt text'e "Audio Guide" ekle
  GuideDetail.tsx — alt text'e "Audio Guide" ekle
  SEO.tsx — og:image:alt meta tag ekle
```

