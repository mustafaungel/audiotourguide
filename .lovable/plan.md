

## Cloudflare Worker Route Test Planı

Route'lar doğru şekilde ayarlanmış, her ikisi de `audiotourguide-proxy` worker'ına yönleniyor.

### Yapılacaklar

1. **CDN route'unu test et** — Bir rehber görselini `audiotourguide.app/cdn/guide-images/...` üzerinden çağırıp görsel dönüp dönmediğini kontrol et
2. **Share route'unu test et** — Bir rehber ID'si ile `audiotourguide.app/share/...` çağırıp OG meta tag'li HTML dönüp dönmediğini kontrol et
3. **Sorun varsa** — Worker kodunu veya route ayarlarını düzelt

### Teknik Detay
- `curl` ile her iki endpoint'i test edeceğim
- CDN: görsel content-type ve cache header'larını doğrulayacağım
- Share: HTML içeriğinde og:title ve og:image tag'lerini kontrol edeceğim

