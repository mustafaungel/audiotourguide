
Amaç: Kullanıcının son geri bildirimine göre mobil premium hissi güçlendirmek ve masaüstü taşmaları kapatmak. Kapsam: ana sayfa hero metin katmanı, rehber kartlarının premium dengesi, mobil alt kontrol/navigation alanı ve özellikle logo çevresindeki desktop overflow sorunları.

1. Ana sayfa hero alanını daha nefes alan ve daha şeffaf hale getireceğim
- `src/components/HeroSection.tsx` içinde hero içerik bloğunu daha az “kutulu” hissettireceğim.
- Mevcut `discover-hero-panel` yoğun opaklığını düşürüp arka plan görselinin daha fazla görünmesini sağlayacağım.
- Başlık ve açıklama çevresindeki padding/margin ritmini açacağım; sıkışık hissi azaltacağım.
- CTA butonlarını görsel hiyerarşiyi bozmayacak şekilde biraz daha kontrollü ayıracağım.
- Mobilde kart hissi korunacak ama “solid panel” yerine daha hafif cam katman etkisi verilecek.

2. Hero için ortak stil tokenlarını rafine edeceğim
- `src/index.css` içinde:
  - `.discover-hero-panel`
  - gerekirse yeni bir daha hafif varyant (`hero-panel-soft` benzeri)
  - hero overlay gradient yoğunluğu
  düzenlenecek.
- Hedef görünüm:
  - daha düşük opaklık
  - daha ince border
  - daha yumuşak blur
  - daha geniş iç boşluk
  - metin okunurluğunu koruyup arka planı öldürmeyen katman dengesi

3. Audio Guide kartlarını daha premium ve daha az “sıkışık liste” gibi hissettireceğim
- `src/components/GuideCard.tsx` yeniden dengelenecek.
- Kartların üst gradient başlığı, içerik alanı, thumbnail ve play aksiyonu arasındaki spacing artırılacak.
- Kart yüksekliği ve iç yerleşimi daha premium editorial düzene çekilecek:
  - görsel alan daha rafine
  - metadata daha net satırlanmış
  - location / duration / language / listening rozetleri daha seçici kullanılacak
  - alt waveform dekoru daha kontrollü hale getirilecek
- Özellikle mobilde kartların üst üste dizildiğinde “çok yoğun” görünmesini azaltacağım.

4. Guide card premium hissi için mikro detayları güçlendireceğim
- Border ve shadow dengesini daha lüks ama hafif yapacağım; ağır görünümden kaçınacağım.
- Featured ve normal kart ayrımı korunacak, ancak ikisi de aynı premium iskelete oturtulacak.
- Play butonu, kartın geri kalanından kopuk görünmeyecek; daha bütünleşik bir aksiyon alanına dönüşecek.
- Gerekirse kart içindeki bazı ikincil bilgiler küçültülüp sadeleştirilecek ki kart daha “expensive” görünsün.

5. Mobil alt kontrol/navigation alanını premiumlaştıracağım
- `src/components/MobileBottomNav.tsx` ve `src/index.css` içindeki:
  - `.mobile-bottom-nav-shell`
  - `.mobile-bottom-nav-item`
  - `.mobile-bottom-nav-icon-wrap`
  stilleri rafine edilecek.
- Kullanıcının paylaştığı 3. görsele göre:
  - dış kapsül daha premium ve daha dengeli olacak
  - aktif sekme daha yumuşak ve daha sofistike vurgulanacak
  - ikon/etiket boşlukları daha native-app hissi verecek
  - alt alan safe-area ile daha temiz hizalanacak
- “Basit bar” görünümü yerine premium mobil audio app hissi verilecek.

6. Masaüstündeki logo ve header taşmalarını kapatacağım
- `src/components/ResponsiveLogo.tsx` ve `src/components/Navigation.tsx` birlikte kontrol edilecek.
- Desktop’ta özellikle:
  - logo kapsayıcısı
  - max-width sınırları
  - shrink davranışı
  - header içindeki gap/padding
  - slogan metninin satır taşıma davranışı
  iyileştirilecek.
- Hedef:
  - logo hiçbir breakpoint’te taşmayacak
  - header dengesi korunacak
  - marka alanı premium ama kontrollü kalacak
  - navigation ile action alanı birbirini itmeyecek

7. Desktop header davranışını yeniden dengeleyeceğim
- Masaüstünde logo kutusunun padding ve max-width değerleri optimize edilecek.
- Gerekirse kompakt logo varyantı desktop için ayrı limitlerle kullanılacak.
- Header’daki marka açıklaması (`Audio-first travel / Discover while you listen`) çok dar alanlarda daha güvenli davranacak:
  - clamp / hide / max-width / truncate dengesi yeniden kurulacak.
- Mobil görünüm korunacak; değişiklikler yalnızca taşma sorunu yaratan kırılımları hedefleyecek.

8. Premium tasarım yönünü mevcut marka ve performans kurallarıyla uyumlu tutacağım
- Mevcut sıcak turuncu/amber marka yönü korunacak.
- Ağır JS animasyonları eklenmeyecek.
- Sadece CSS tabanlı, GPU dostu blur/shadow/transform ayarları kullanılacak.
- Mevcut audio-guide kimliği ve “Cinematic Audio Layers” yönü korunacak; sadece daha rafine hale getirilecek.

9. Dokunulacak dosyalar
- `src/components/HeroSection.tsx`
- `src/components/GuideCard.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/components/Navigation.tsx`
- `src/components/ResponsiveLogo.tsx`
- `src/index.css`

10. Beklenen sonuç
- Ana sayfa hero metni daha şeffaf, daha ferah ve daha premium görünecek.
- Audio Guide kartları mobilde daha lüks, daha okunaklı ve daha az sıkışık hissedilecek.
- Alt navigation/kontrol alanı daha premium bir native uygulama kalitesine yaklaşacak.
- Masaüstünde özellikle logo çevresindeki taşma problemi kapanacak.
- Tüm bu iyileştirmeler sadece UI tarafında kalacak; hız ve mevcut iş mantığı korunacak.
