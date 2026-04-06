
Amaç: Publish etmeden önce preview linkinde Audio Access akışını gerçekten test edebilmenizi sağlamak.

Sorunun özeti:
- Evet, yaşadığınız durum kodla tutarlı görünüyor.
- Audio access’e giden bazı linkler preview origin’i yerine veritabanındaki `share_url` alanını kullanıyor.
- Bu `share_url` ise edge function’larda özellikle canlı domain ile üretiliyor:
  - `supabase/functions/create-guide/index.ts` → `shareUrl = ${baseUrl}/access/...`
  - `supabase/functions/generate-qr-code/index.ts` → preview/sandbox olsa bile `https://audiotourguide.app` kullanıyor
- Bu yüzden admin panelden veya kayıtlı paylaşım linklerinden açtığınızda, fark etmeden published site’a gidiyorsunuz.
- Sonuç: preview’de test ettiğinizi sanarken aslında canlı sürümü görmüş oluyorsunuz.

Kodda gördüğüm kritik tutarsızlıklar:
1. Router gerçek route olarak bunu kullanıyor:
   - `src/App.tsx` → `/access/:guideId`
2. Ama bazı yerlerde hâlâ legacy link formatı var:
   - `src/components/AdminQRCodeDropdown.tsx` → `/audio-access?code=...`
3. Bazı preview butonları da direkt `guide.share_url` açıyor:
   - `src/components/GuideManagement.tsx`

Bu yüzden neden publish etmeden test edemediğiniz net:
- Preview UI açık olsa bile, “open/copy access link” aksiyonları sizi production domain’e taşıyor.
- Publish ettikten sonra değişiklik görünmesinin sebebi de bu: artık açılan domain gerçekten güncel canlı sürüm oluyor.

Önerilen çözüm:
1. Preview test ile paylaşım/canlı link mantığını ayırın
- `share_url` ve QR linkleri canlı domain için kalabilir.
- Ama admin içindeki “Preview/Open/Test access” butonları `window.location.origin` tabanlı local/preview URL üretmeli.
- Yani test butonu veritabanındaki `share_url`’u açmamalı.

2. Tek bir access URL helper oluşturun
- Örn. `buildAccessUrl({ guideId, accessCode, baseUrl })`
- İki mod:
  - preview/test → `window.location.origin`
  - public/share → production base URL
- Böylece aynı projede biri test, biri canlı olmak üzere iki net kullanım olur.

3. Legacy route kalıntılarını temizleyin
- `/audio-access?code=...` yerine her yerde:
  - `/access/:guideId?access_code=...`
- Bu özellikle `AdminQRCodeDropdown.tsx` içinde düzeltilmeli.

4. Admin panelde iki ayrı aksiyon netleştirin
- “Test in Preview”:
  - her zaman `window.location.origin` ile açsın
- “Copy Public Access Link”:
  - veritabanındaki `share_url` veya production base URL kullansın
- Böylece yanlış ortam açılması engellenir.

5. GuideManagement preview davranışını düzeltin
- Şu an `guide.share_url` varsa onu açıyor; bu test için yanlış.
- Preview/Test açılışları production linki değil current origin’i kullanmalı.

Önerilen uygulanacak dosyalar:
- `src/components/GuideManagement.tsx`
- `src/components/AdminQRCodeDropdown.tsx`
- Gerekirse `src/lib/url-utils.ts`
- İsteğe bağlı: access link üretimi yapan ortak helper dosyası

Teknik yaklaşım:
```text
Test/Preview butonu:
current origin + /access/:guideId?access_code=...

Public share / QR:
production base URL + /access/:guideId?access_code=...
```

Beklenen sonuç:
- Publish etmeden önce preview linkinde Audio Access sayfalarını gerçekten test edebilirsiniz.
- Mobilde Share Preview linkiyle de aynı preview sürüm test edilir.
- Public QR/share linkleri ise canlı domain’e bağlı kalır.

Ek not:
- Siz “preview lovable linkinden test edeyim” dediğiniz kullanım için mevcut yapı uygun değil; çünkü mevcut admin aksiyonlarının bir kısmı test linki değil, canlı paylaşım linki açıyor.
- Bu bir deploy problemi değil, link üretimi/origin seçimi problemi.

Doğrulama planı:
1. Admin’den guide için “Test in Preview” aç
2. URL’nin preview domain’de kaldığını kontrol et
3. Audio Access’te dil değiştir
4. Linked guide’ları mobilde açıp sesi doğrula
5. Ayrı olarak “Copy Public Link” ile canlı domain üretildiğini doğrula

Benim önerim:
- Public link mantığını koruyalım
- Ama admin/test akışlarına ayrı “Preview/Test Access” URL üretimi ekleyelim
- Böylece publish etmeden güvenli şekilde test edebilirsiniz
