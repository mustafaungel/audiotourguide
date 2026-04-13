

## Sorun Analizi

Worker route'ları Cloudflare'de doğru ayarlanmış (ekran görüntüsünde onaylandı). Worker 8 istek alıyor ve 0 hata veriyor — yani **Cloudflare Worker çalışıyor**, ama `/cdn/*` ve `/share/*` isteklerini yakalamak yerine doğrudan origin'e (Lovable hosting) yönlendiriyor. Bu, büyük ihtimalle Worker kodunun düzgün kaydedilmemiş olmasından kaynaklanıyor.

### Yapılacaklar

**Adım 1: Worker kodunu doğrula (Kullanıcı yapacak)**

Cloudflare Dashboard'dan Worker'ın "Edit Code" bölümüne gidip kodun gerçekten güncellenmiş olduğunu kontrol et. Eğer hâlâ `addEventListener("fetch", ...)` veya `Hello World` görüyorsan, aşağıdaki kodu yapıştırıp **Save and Deploy** tıkla:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/cdn/')) {
      const storagePath = url.pathname.replace('/cdn/', '');
      const supabaseUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/${storagePath}`;
      const res = await fetch(supabaseUrl, {
        cf: { cacheEverything: true, cacheTtl: 86400 }
      });
      if (!res.ok) {
        return new Response('Not found', { status: 404 });
      }
      const response = new Response(res.body, res);
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }
    
    if (url.pathname.startsWith('/share/')) {
      const guideId = url.pathname.replace('/share/', '');
      const params = url.searchParams;
      const accessCode = params.get('access_code');
      const ogUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/og-image?id=${guideId}${accessCode ? '&access_code=' + accessCode : ''}`;
      return fetch(ogUrl);
    }
    
    return fetch(request);
  }
}
```

**Adım 2: Test et (Ben yapacağım)**

Worker kodu güncellendikten sonra şu endpoint'leri test edeceğim:
- `audiotourguide.app/cdn/guide-images/` altından bir görsel
- `audiotourguide.app/share/` altından bir rehber paylaşım linki

**Adım 3: Kod değişiklikleri (Ben yapacağım — Worker çalıştıktan sonra)**

`url-utils.ts` dosyasında CDN ve share URL'lerinin doğru üretildiğini onaylayıp gerekirse güncelleyeceğim.

### Önemli Not
Domain veya DNS'te sorun yok. Route'lar doğru yerde, Worker istek alıyor. Sorun sadece Worker'ın iç kodunun doğru çalışıp çalışmadığıyla ilgili.

