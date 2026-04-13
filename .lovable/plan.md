

## Test Planı

Worker kodu güncellenmiş ve deploy edilmiş. Şimdi:

1. **Veritabanından bir rehber bilgisi çek** — test için gerçek bir guide ID ve image_url lazım
2. **CDN endpoint'ini test et** — `curl` ile `audiotourguide.app/cdn/guide-images/...` çağır, content-type ve cache header'larını kontrol et
3. **Share endpoint'ini test et** — `curl` ile `audiotourguide.app/share/{guideId}` çağır, og:title ve og:image tag'lerini kontrol et
4. **Sorun varsa düzelt** — url-utils.ts veya Worker kodunda gerekli değişiklikleri yap

