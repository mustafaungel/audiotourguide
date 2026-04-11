

## Sorun: OG Image Edge Function Deploy Edilmemiş

### Analiz
- `og-image` Edge Function'ı test ettim — her iki çağrıda da SPA'nın varsayılan `index.html`'i döndü
- Bu da demek ki fonksiyon hiç çalışmıyor — WhatsApp/Telegram crawlerları `index.html`'deki varsayılan OG tag'lerini okuyor
- Varsayılan OG tag'ler: `og:image = logo-audio-tour-guides.png` (site logosu)
- Fonksiyon kodu doğru yazılmış, sadece deploy edilmesi gerekiyor

### Plan

**Adım 1: `og-image` Edge Function'ı deploy et**
- `supabase--deploy_edge_functions` ile fonksiyonu deploy et
- Fonksiyon kodu zaten doğru — guide bilgilerini DB'den çekip rehber görseli ile OG tag döndürüyor

**Adım 2: Deploy sonrası test et**
- Gerçek bir guide ID ile fonksiyonu çağır
- Dönen HTML'de `og:image`'ın rehber görseli olduğunu doğrula (site logosu değil)

**Adım 3: Varsa küçük iyileştirme**
- Fonksiyonda XSS koruması ekle (title/description'daki HTML karakterlerini escape et)
- CORS header ekle (bazı crawlerlar için gerekebilir)

### Sonuç
Deploy sonrası ShareLink bileşenindeki URL (`/functions/v1/og-image?id=...`) düzgün çalışacak ve paylaşımlarda rehber görseli + başlığı görünecek.

Kod değişikliği: minimal (sadece XSS escape ekleme). Ana iş: deployment + test.

