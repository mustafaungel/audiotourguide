

## Worker Endpoint Test Planı

DNS kayıtları doğru yapılandırılmış (her ikisi de Proxied). Worker kodu da güncellendi. Şimdi endpoint'leri test edeceğim:

1. **Veritabanından test verisi çek** — Bir rehber ID ve image_url al
2. **CDN endpoint test** — `curl -I https://audiotourguide.app/cdn/guide-images/...` ile görsel dönüp dönmediğini kontrol et
3. **Share endpoint test** — `curl https://audiotourguide.app/share/{guideId}` ile OG tag'li HTML dönüp dönmediğini kontrol et
4. **Başarılıysa** — `url-utils.ts` zaten doğru URL'leri üretiyor, ek değişiklik gerekmez
5. **Başarısızsa** — Worker kodunu veya route ayarlarını debug et

### Teknik Detay
- `supabase--read_query` ile rehber bilgisi alacağım
- `code--exec` ile `curl` kullanarak her iki endpoint'i test edeceğim
- Header'larda `Content-Type`, `Cache-Control` ve `cf-worker` kontrolü yapacağım

