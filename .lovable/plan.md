

## Test Planı

Worker kodu ve route'lar doğru yapılandırılmış. Şimdi endpoint'leri test edeceğim:

1. **Veritabanından bir rehber bul** — Supabase'den bir guide ID ve image_url al
2. **CDN endpoint'ini test et** — `audiotourguide.app/cdn/guide-images/...` üzerinden görsel çek, header'ları kontrol et
3. **Share endpoint'ini test et** — `audiotourguide.app/share/{guideId}` üzerinden OG tag'li HTML dönüp dönmediğini kontrol et
4. **Sorun varsa** — url-utils.ts dosyasını güncelleyerek CDN/share URL'lerinin doğru üretilmesini sağla

### Teknik Detay
- `supabase--read_query` ile rehber bilgisi alacağım
- `code--exec` ile `curl` kullanarak her iki endpoint'i test edeceğim
- Başarılıysa `url-utils.ts`'deki URL helper'larını kontrol edip gerekirse güncelleyeceğim

