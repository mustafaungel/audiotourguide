

## Cloudflare Worker ile Görselleri ve Paylaşım Linklerini Ana Domain Altına Taşıma

### Durum
- DNS başarıyla Cloudflare'e taşınmış ✓
- Site Cloudflare proxy üzerinden çalışıyor ✓
- Şimdi Cloudflare Worker kurulumu ve kod değişiklikleri yapılacak

### Plan

**Adım 1: Cloudflare Worker Oluşturma (Kullanıcı yapacak — adım adım talimat vereceğim)**

Cloudflare Dashboard'da bir Worker oluşturulacak. Bu Worker iki route'u handle edecek:

```text
audiotourguide.app/cdn/*  → Supabase Storage'dan görsel çeker
audiotourguide.app/share/* → og-image Edge Function'dan OG HTML çeker
```

Worker kodu ~40 satır, kopyala-yapıştır ile kurulacak. İki route Cloudflare'de tanımlanacak.

**Adım 2: Kod Değişiklikleri (Lovable'da yapacağım)**

| Dosya | Değişiklik |
|-------|-----------|
| `src/lib/url-utils.ts` | `getProxiedImageUrl()` → `https://audiotourguide.app/cdn/...` formatında dönsün |
| `src/components/ShareLink.tsx` | Share URL → `https://audiotourguide.app/share/{guideId}` |
| `src/components/SEO.tsx` | OG image URL'lerini yeni `audiotourguide.app/cdn/...` formatıyla güncelle |
| `supabase/functions/og-image/index.ts` | `og:image`'da `audiotourguide.app/cdn/...` kullan + `noindex`/`canonical` ekle |

**Adım 3: og-image Edge Function'ı Deploy Et**

Güncellenen fonksiyonu deploy edip test et.

**Adım 4: Test**
- WhatsApp'ta paylaşım linki test et — rehber görseli ve başlığı görünmeli
- Google'da `site:dsaqlgxajdnwoqvtsrqd.supabase.co` kontrolü — zamanla temizlenmeli

### Cloudflare Worker Şablonu (referans)

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // /cdn/* → Supabase Storage proxy
    if (url.pathname.startsWith('/cdn/')) {
      const storagePath = url.pathname.replace('/cdn/', '');
      const supabaseUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/${storagePath}`;
      const res = await fetch(supabaseUrl);
      return new Response(res.body, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        }
      });
    }
    
    // /share/* → og-image Edge Function proxy
    if (url.pathname.startsWith('/share/')) {
      const guideId = url.pathname.replace('/share/', '');
      const accessCode = url.searchParams.get('access_code') || '';
      const ogUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/og-image?id=${guideId}${accessCode ? `&access_code=${accessCode}` : ''}`;
      return fetch(ogUrl);
    }
    
    // Diğer istekleri olduğu gibi geçir (Lovable hosting'e)
    return fetch(request);
  }
}
```

Cloudflare'de route'lar:
- `audiotourguide.app/cdn/*`
- `audiotourguide.app/share/*`

### Sonuç
- Tüm görseller `audiotourguide.app/cdn/...` altından sunulacak
- Paylaşım linkleri `audiotourguide.app/share/...` olacak
- Google Search Console hataları zamanla temizlenecek
- Mevcut işlevsellik bozulmayacak
- Ek maliyet: $0 (Cloudflare Workers ücretsiz plan günde 100K istek)

### Önemli Not
Cloudflare Worker kurulumu için adım adım talimat vereceğim (ekran görüntüleri ile). Siz Worker'ı oluşturduktan sonra kod değişikliklerini yapacağım.

