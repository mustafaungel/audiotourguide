

## 3 Sorunun Analizi ve Çözümü

### Sorun 1: İlk girişte yeşil lokasyon imleci (yanlış logo) gösteriliyor

**Sebep:** `ResponsiveLogo` bileşeninde, branding verisi Supabase'den yüklenene kadar `logoUrl` null olarak kalıyor. Bu durumda `FallbackIcon` gösteriliyor — bu da yeşil arka planlı MapPin ikonu. localStorage cache'i boşsa (ilk ziyaret veya temizlenmiş cache), Supabase sorgusu tamamlanana kadar bu fallback ikon görünüyor.

**Çözüm:** Fallback ikonu yerine statik logo dosyasını (`/logo-audio-tour-guides.png`) kullan. `ResponsiveLogo`'daki fallback'i MapPin ikonu yerine bu görsele çevir.

### Sorun 2: Favicon Google logosu gösteriyor

**Sebep:** `index.html`'deki statik favicon `/logo-audio-tour-guides.png`'ye işaret ediyor. `FaviconUpdater` ise Supabase'den `faviconUrl` çekiyor. Eğer `faviconUrl` null ise yine `/logo-audio-tour-guides.png`'ye düşüyor — bu dosya muhtemelen eski/yanlış bir görsel veya tarayıcı cache'inde Google favicon'u kalmış.

**Çözüm:** 
- `public/` klasöründe gerçek favicon dosyasının (`logo-audio-tour-guides.png`) doğru olup olmadığını kontrol et
- Eğer favicon Supabase'de tanımlı değilse, doğru favicon dosyasını ayarla
- `index.html`'de cache-busting ekle

### Sorun 3: Access linklerini paylaşınca site logosu gösteriliyor (guide görseli değil)

**Sebep:** `og-image` Edge Function'ı doğru çalışıyor — guide görselini OG tag olarak sunuyor. Ancak sorun şu olabilir:
1. WhatsApp/Telegram önbellekte eski görseli tutmuş olabilir
2. Eğer access sayfasından doğrudan paylaşıyorsanız (ShareLink bileşeni yerine tarayıcının paylaş butonuyla), Edge Function proxy'si bypass ediliyor ve SPA'nın `index.html`'indeki statik OG görseli (`logo-audio-tour-guides.png`) gösteriliyor

**Çözüm:** Tüm paylaşım noktalarının Edge Function proxy URL'sini kullanmasını sağla. Access sayfasındaki paylaşım butonunun `ShareLink` bileşenini kullanıp kullanmadığını kontrol et.

---

## Yapılacak Değişiklikler

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/ResponsiveLogo.tsx` | FallbackIcon'u MapPin yerine `/logo-audio-tour-guides.png` statik görseli yapacak |
| `index.html` | Favicon href'ine cache-busting ekle, doğru dosyayı referans aldığından emin ol |
| `src/pages/AudioAccess.tsx` | Paylaşım butonunun ShareLink (Edge Function proxy) kullanıp kullanmadığını kontrol et, kullanmıyorsa düzelt |

