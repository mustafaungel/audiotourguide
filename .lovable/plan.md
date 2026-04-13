

## Alt Domain ile Cloudflare Worker Kurulumu

### Özet
`audiotourguide.app/cdn/*` path-based route'ları çalışmadığı için `cdn.audiotourguide.app` alt domain'ine geçiyoruz. Worker bu alt domain'e bağlanacak, kod tarafında URL'ler güncellenecek.

---

### Adım 1: Cloudflare'de Alt Domain Oluşturma (Sizin yapacağınız)

1. **Cloudflare Dashboard → audiotourguide.app → DNS → Records**
2. Yeni kayıt ekleyin:
   - **Type:** CNAME
   - **Name:** `cdn`
   - **Target:** `audiotourguide-proxy.mustafaungel.workers.dev`
   - **Proxy status:** 🟠 Proxied
3. **Workers & Pages → audiotourguide-proxy → Settings → Domains & Routes**
4. **Add → Custom Domain** tıklayın
5. `cdn.audiotourguide.app` yazın ve kaydedin

### Adım 2: Worker Kodunu Güncelleme (Sizin yapacağınız)

Worker artık alt domain'de çalışacağı için path prefix kontrolü değişmeli:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // /share/* → og-image Edge Function proxy
    if (url.pathname.startsWith('/share/')) {
      const guideId = url.pathname.replace('/share/', '');
      const accessCode = url.searchParams.get('access_code') || '';
      const ogUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/og-image?id=${guideId}${accessCode ? '&access_code=' + accessCode : ''}`;
      return fetch(ogUrl);
    }
    
    // Diğer tüm istekler → Supabase Storage proxy
    // cdn.audiotourguide.app/guide-images/abc.jpg → Storage
    const storagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    if (storagePath) {
      const supabaseUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/${storagePath}`;
      const res = await fetch(supabaseUrl);
      return new Response(res.body, {
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
}
```

### Adım 3: Kod Değişiklikleri (Ben yapacağım)

**Dosya: `src/lib/url-utils.ts`**
- `CDN_BASE` → `https://cdn.audiotourguide.app` olarak güncelle
- `getShareUrl()` → `https://cdn.audiotourguide.app/share/...` olarak güncelle

**Dosya: `supabase/functions/og-image/index.ts`**
- `CDN_BASE` → `https://cdn.audiotourguide.app` olarak güncelle

Toplam 2 dosyada 3 satır değişiklik.

### Adım 4: Test (Ben yapacağım)
- `curl -I https://cdn.audiotourguide.app/guide-images/...` — görsel dönmeli
- `curl https://cdn.audiotourguide.app/share/{guideId}` — OG tag'li HTML dönmeli

---

### Sonuç URL Formatları

```text
Eski (çalışmıyor):  audiotourguide.app/cdn/guide-images/abc.jpg
Yeni:                cdn.audiotourguide.app/guide-images/abc.jpg

Eski (çalışmıyor):  audiotourguide.app/share/xxx-yyy
Yeni:                cdn.audiotourguide.app/share/xxx-yyy
```

### Sıralama
Önce siz Cloudflare'de Adım 1 ve 2'yi yapın, sonra bana haber verin — ben de kod değişikliklerini yapıp test edeceğim.

