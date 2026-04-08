
Amaç: iki ana problemi birlikte düzeltmek:
1. Light/dark modda hover/focus sırasında yazıların görünmez olması ve renk çakışmaları
2. Admin’deki guide order ile ana sayfa/public listelerin uyuşmaması ve tüm guide’ların görünmemesi

1. Tema/renk problemi için kök düzeltme
- `src/components/ui/button.tsx` içindeki `ghost` varyantını düzelteceğim.
- Mevcut sorun: `hover:text-accent-foreground` global olduğu için, sadece arka plan override edilen butonlarda yazı hover’da beyaza dönüyor.
- Yeni yaklaşım:
  - `ghost` default’unu `hover:bg-accent hover:text-accent-foreground` yerine daha güvenli, semantik ve kontrastlı hale getirmek
  - Özellikle admin gibi text-heavy alanlarda hover’da foreground’un korunmasını sağlamak
- Bu, sadece QR Code Management değil; tüm ghost buton tabanlı hover bug’larını sistem genelinde toparlar.

2. Kırılan ortak UI primitive’leri düzeltme
Aşağıdaki primitive dosyalarda hover/focus text/background kombinasyonlarını gözden geçirip güvenli hale getireceğim:
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- gerekirse aynı desen olan diğer Radix wrapper’lar (`menubar`, `navigation-menu`, `toggle`)
Amaç:
- Light modda beyaz yazı/beyazımsı zemin
- Dark modda düşük kontrast
- focus/open state’lerde okunmaz menü item’ları
sorunlarını topluca çözmek.

3. Admin panel özel düzeltmeleri
- `src/components/AdminDashboard.tsx`
  - Collapsible trigger’larda hover/focus durumunu açık ve tutarlı hale getireceğim
  - Gerekirse `text-foreground` / `hover:text-foreground` açıkça eklenecek
- `src/components/AdminGuideOrderManager.tsx`
  - Row içindeki action icon butonlarının light/dark hover arka planlarını da normalize edeceğim
  - Böylece admin listede ikonlar ve metinler tüm temalarda tutarlı olur

4. Public tarafta renk çakışmalarını derinlemesine toparlama
Özellikle görselde öne çıkan kart/list alanlarında:
- `src/components/GuideCard.tsx`
- `src/components/FeaturedGuides.tsx`
- `src/pages/Index.tsx`
- `src/pages/Guides.tsx`
Yapılacaklar:
- hardcoded veya zayıf kontrastlı badge/overlay/secondary button alanlarını semantik token’larla eşleştirmek
- kart üstü badge, fiyat badge, overlay button ve hover state’leri light/dark için tek tek düzeltmek
- hover’da metin renginin beklenmedik değişmesini engellemek

5. Guide order neden public tarafta farklı görünüyor: kök neden
Kod analizi sonucu iki ana sebep var:
- Admin listesi tüm guide’ları gösteriyor; ana sayfa/public listeler yalnızca `is_published + is_approved + is_standalone` guide’ları gösteriyor
- Ana sayfada liste grid değil, carousel; dolayısıyla “tamamı görünmüyor” hissi normal, çünkü geri kalanlar yatay kayıyor ve görünür değil

6. Sıralama uyumsuzluğu için uygulanacak çözüm
- `src/components/AdminGuideOrderManager.tsx`
  - Mevcut yapıyı koruyacağım ama görünür/public sıralamayı daha net temsil edecek hale getireceğim
  - Gerekirse plan dahilinde visible/public subset mantığını yansıtacak küçük iyileştirme yapılacak
- `src/pages/Index.tsx`
  - Ana sayfadaki carousel’i public sıralamayı daha net gösteren yapıya çevireceğim
  - En azından:
    - görünür navigation eklemek
    - desktop’ta daha fazla item görünür hale getirmek
    - mobile/desktop’ta “tamamı görünmüyor” algısını kaldırmak
- `src/pages/Guides.tsx`
  - Zaten grid kullanıyor; burada asıl amaç admin sıralamasıyla aynı public subset’i net biçimde göstermek
  - ordering query tutarlılığı korunacak, gerekirse secondary sort normalize edilecek

7. Ana sayfada tüm guide’ların görünmemesi için çözüm
- En net çözüm: `Index.tsx` içindeki yatay carousel yapısını daha görünür/navigable hale getirmek
- Muhtemel uygulama:
  - `CarouselPrevious` / `CarouselNext` butonlarını ana sayfada da aktif göstermek
  - masaüstünde daha fazla kartı aynı anda göstermek
  - istenirse carousel yerine responsive grid’e geçmek
Kod yapısına göre en düşük riskli seçenek: önce mevcut carousel’i görünür navigasyonla ve daha doğru basis değerleriyle düzeltmek.

8. Uygulama yaklaşımı
Sıra:
1. ortak theme primitive’leri
2. admin hover/focus alanları
3. public card/list renkleri
4. homepage ordering/görünürlük
5. guides page ordering consistency

9. Etki
Bu değişikliklerden sonra:
- hover’da yazıların beyaza dönmesi gibi tema bug’ları sistem genelinde kalkacak
- admin ve son kullanıcı tarafında dark/light kontrast daha tutarlı olacak
- ana sayfadaki public guide sırası admin’deki public sırayla daha uyumlu algılanacak
- mobile ve desktop’ta daha fazla guide görünür olacak, “tamamı görünmüyor” sorunu giderilecek

Teknik not
- Kök renk problemi büyük ölçüde `Button` ghost varyantından geliyor; bunu sadece tek tek sayfalarda yamamak yerine primitive seviyesinde çözeceğim
- Sıralama problemi veri kaybı değil; admin liste mantığı ile public liste mantığı farklı. Public görünüm yalnızca yayınlanmış/onaylı/standalone guide’ları gösteriyor
- Ana sayfadaki “tamamı görünmüyor” sorunu veri sırası kadar layout kaynaklı: `Index.tsx` içinde carousel var, grid yok; bu yüzden tüm öğeler aynı anda görünmüyor
