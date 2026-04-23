
Amaç: Admin ve Access sayfaları hariç, login dahil tüm kullanıcı sayfalarında mobil öncelikli, hızlı, kalıcı ve “audio guide” kimliğini güçlü biçimde hissettiren kapsamlı bir UI dönüşümü yapmak. Seçtiğin yön: Cinematic Audio Layers + Discover-first ana akış + tipografi ağırlığı + bottom navigation.

1. Tasarım yönünü tek bir mobil sistem haline getireceğim
- Mevcut renk paletini koruyacağım; yeni bir marka rengi icat etmeyeceğim.
- Görsel dil: katmanlı yüzeyler, kontrollü glow, yumuşak depth, premium ses ürünü hissi.
- İçerik dili: büyük başlık, güçlü alt başlık, sade ama lüks kart düzeni.
- “Basit” görünümü kırmak için yoğunluğu rastgele artırmak yerine ritim, hiyerarşi ve yüzey kalitesi artırılacak.
- Performans için blur ve shadow kullanımı kontrollü olacak; sadece kritik alanlarda hafif ve optimize edilmiş şekilde uygulanacak.

2. Ortak mobil UI foundation kurulacak
Aşağıdaki ortak yapı tüm kullanıcı sayfalarına yayılacak:
- Yeni mobil shell yapısı
  - üstte ince/sticky compact header
  - altta safe-area uyumlu bottom navigation
  - içerikte daha iyi spacing, section rhythm ve scroll akışı
- Ortak mobil section header pattern
  - küçük label
  - güçlü başlık
  - kısa açıklama
  - opsiyonel aksiyon
- Ortak kart sistemi
  - tipografi odaklı kart başlıkları
  - daha premium yüzey
  - daha net bilgi gruplama
  - daha iyi thumb zone CTA yerleşimi
- Ortak boş durum / loading / CTA blokları
  - daha markalı ve tutarlı görünüm
- Ortak mobil spacing/token iyileştirmeleri
  - alt navigation ile çakışmayan padding
  - safe-area ve mini player uyumlu alt boşluklar
  - tek tip radius / border / shadow dili

3. Bottom navigation eklenecek
Admin ve Access dışında mobil kullanıcı akışında alt navigation eklenecek.
Önerilen sekmeler:
- Discover
- Guides
- Destinations
- Library
- Account / Sign In

Davranış:
- aktif route net şekilde vurgulanacak
- hızlı thumb navigation sağlanacak
- mini player ve safe-area ile çakışmayacak
- desktop’ta görünmeyecek, sadece mobil/tablet alt kırılımlarda çalışacak

4. Sayfa bazlı dönüşüm planı
Kapsam dahilindeki sayfalar:
- /
- /admin-login
- /guides
- /guide/:slug
- /library
- /country
- /country/:countrySlug
- /featured-guides
- /payment-success
- /payment-cancelled
- 404 sayfası

A) Home / Discover
Seçimin doğrultusunda ana sayfa “discover-first” olacak.
- Hero daha kompakt ama daha premium hale gelecek
- ilk ekranda keşif duygusu güçlenecek
- section’lar “listen now” değil “discover destinations / curated guides / featured experiences” mantığında akacak
- filtre ve guide listesi daha editorial ve mobil dostu olacak
- kart yoğunluğu yerine akış kalitesi artırılacak

B) Login
- mevcut sade auth kartı tamamen premium mobil auth deneyimine dönüştürülecek
- daha güçlü başlık, daha iyi giriş hiyerarşisi, daha rafine tabs/form yüzeyleri
- CTA ve input düzeni başparmak erişimine göre optimize edilecek
- sayfa “admin login” değil markanın kullanıcı giriş kapısı gibi hissedecek

C) Guides
- üst arama alanı ve filtre aksiyonları sticky/mobile-friendly hale gelecek
- category chips daha rafine hale getirilecek
- guide kartları tipografi odaklı ve daha editorial görünecek
- sonuç, filtre ve keşif akışı daha hızlı okunur olacak

D) Guide Detail
- mobil hero ve bilgi hiyerarşisi sadeleşecek ama daha premium görünecek
- başlık, lokasyon, badge, dil, satın alma / dinleme aksiyonları yeniden dengelenecek
- kartlar ve içerik blokları “audio-first luxury” çizgisine çekilecek
- kritik CTA’lar thumb zone’a yakınlaştırılacak

E) Library
- mevcut yapı masaüstü ağırlıklı his veriyor; mobil öncelikli yeniden kurgulanacak
- continue listening, recent purchases, progress, saved guides gibi bloklar daha temiz sunulacak
- gereksiz yoğun analytics görünümü mobilde sadeleştirilecek
- dinleme odaklı kart/row yapısı kurulacak

F) Countries / Country Detail / Featured Guides
- arama, başlık alanı ve grid akışı ortak mobil sistemle hizalanacak
- keşif, kategori ve destinasyon hissi güçlendirilecek
- country kartları ve listing yapıları daha güçlü yüzey ve tipografi ile yenilenecek

G) Payment Success / Cancelled / 404
- bunlar şu an fonksiyonel ama görsel olarak zayıf
- aynı premium mobil sistemle uyumlu sonuç ekranlarına dönüşecek
- daha iyi ikon alanı, bilgi blokları, aksiyon grupları ve CTA hiyerarşisi eklenecek

5. Performans kuralları
Bu çalışma sadece UI değişikliği olarak kalacak; hız öncelikli olacak.
- transform/opacity tabanlı animasyon
- layout thrash oluşturan ağır animasyonlardan kaçınma
- navbar ve bottom nav’da hafif efektler
- kartlarda kontrollü shadow/depth
- yeni veri yükü eklememe
- mevcut query/data fetching yapısını bozmama
- görsel kaliteyi CSS sistematiği ile artırma, ağır JS ile değil

6. Audio guide temasına özel görsel prensipler
Seçtiğin “Cinematic Audio Layers” yönü şu şekilde uygulanacak:
- ses dalgası, waveform, canlı dinleme, oynatma hissi dekoratif ama kontrollü kullanılacak
- büyük ve güçlü tipografiyle “story + listening” kimliği verilecek
- kartlarda sadece görsel değil, ses deneyimi hissi olacak
- amber/warm primary tonlar korunacak
- koyu/açık mod dengesi bozulmadan premium yüzeyler oluşturulacak

7. Uygulama sırası
Faz 1 — Temel sistem
- mobile shell
- bottom navigation
- ortak spacing/section/card tokenları
- shared navigation/footer mobil revizyonu

Faz 2 — Ana keşif sayfaları
- Index
- Guides
- Countries
- FeaturedGuides
- CountryDetail

Faz 3 — Dönüşüm ve sahiplik sayfaları
- Auth
- GuideDetail
- Library
- PaymentSuccess
- PaymentCancelled
- NotFound

Faz 4 — Son polish
- mobil spacing audit
- bottom nav + mini player çakışma kontrolü
- sticky alanlar ve safe-area düzeltmeleri
- dark/light görünüm tutarlılığı

8. Teknik detaylar
Muhtemel dokunulacak alanlar:
- src/index.css
- src/components/Navigation.tsx
- yeni bir shared MobileBottomNav component
- src/pages/Index.tsx
- src/pages/Auth.tsx
- src/pages/Guides.tsx
- src/pages/GuideDetail.tsx
- src/pages/Library.tsx
- src/pages/Countries.tsx
- src/pages/CountryDetail.tsx
- src/pages/FeaturedGuides.tsx
- src/pages/PaymentSuccess.tsx
- src/pages/PaymentCancelled.tsx
- src/pages/NotFound.tsx
- gerektiğinde GuideCard / SearchAutocomplete / Footer / EnhancedLibrary gibi kullanıcıya görünen ortak bileşenler

9. Bu planda özellikle korunacak sınırlar
- Admin sayfasına dokunulmayacak
- Access sayfasına dokunulmayacak
- backend mantığı değişmeyecek
- veri modeli değişmeyecek
- marka renk yönü korunacak
- değişiklikler yalnızca UI/UX tarafında olacak

10. Beklenen sonuç
- mobilde daha premium, daha hızlı algılanan, daha “app-like” bir ürün hissi
- thumb-friendly ve tek elle kullanım için daha iyi akış
- audio guide odaklı, kalıcı bir görsel temel
- daha güçlü keşif deneyimi
- gelecekte yeni ekranlar eklense bile aynı sistemle büyüyebilecek sağlam bir tasarım omurgası
