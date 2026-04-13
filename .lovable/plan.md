

## cdn.audiotourguide.app Endpoint Test Planı

Route doğru yapılandırılmış. Şimdi:

1. **Veritabanından test verisi çek** — Gerçek bir guide ID ve image_url al
2. **CDN görsel testi** — `curl -I https://cdn.audiotourguide.app/guide-images/...` çalıştır
3. **Share/OG testi** — `curl https://cdn.audiotourguide.app/share/{guideId}` çalıştır
4. **Sonuçlara göre** — Başarılıysa tamamdır, başarısızsa debug et

Ek not: Eski route'ları (`audiotourguide.app/share/*` ve `audiotourguide.app/cdn/*`) artık silmenizi önerebilirim — bunlar zaten çalışmıyordu ve karışıklık yaratabilir.

### Teknik Detay
- `supabase--read_query` ile rehber bilgisi
- `code--exec` ile `curl` testleri
- Kod değişikliği gerekmez — zaten `cdn.audiotourguide.app` kullanıyor

