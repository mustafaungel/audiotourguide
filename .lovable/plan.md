

## cdn.audiotourguide.app Endpoint Test Planı

DNS ve Worker hazır. Şimdi endpoint'leri test edeceğim:

1. **Veritabanından test verisi çek** — Bir guide ID ve image_url al
2. **CDN görsel testi** — `curl -I https://cdn.audiotourguide.app/guide-images/...` ile görsel dönüp dönmediğini kontrol et
3. **Share/OG testi** — `curl https://cdn.audiotourguide.app/share/{guideId}` ile OG tag'li HTML dönüp dönmediğini kontrol et
4. **Başarısızsa** — Worker veya DNS sorununu debug et

### Teknik Detay
- Supabase'den gerçek bir rehber bilgisi çekip test edeceğim
- `curl` ile header'ları kontrol edeceğim (Content-Type, Cache-Control)
- Kod değişikliği gerekmez — `url-utils.ts` ve `og-image/index.ts` zaten `cdn.audiotourguide.app` kullanıyor

