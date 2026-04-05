
Durumu anladım: videodaki temel bozukluk sadece “tab değişince küçük bir jump” değil; mobilde AudioAccess içinde guide/tab/language tıklamalarında içerik bloğunun yeniden ölçülüp sayfanın yukarı-aşağı oynaması.

Koddaki ana nedenler:
1. `AudioAccess.tsx` içinde `MultiTabAudioPlayer` hâlâ `key={`${guide.id}-${accessCode || ''}`}` ile render ediliyor. Bu, parent tarafta gereksiz re-mount riskini açık tutuyor.
2. `MultiTabAudioPlayer.tsx` içinde `forceMount + hidden + min-h-[400px]` var ama bu sabit yükseklik gerçek içerik yüksekliğini garanti etmiyor; chapter sayısı fazla/az olduğunda mobilde yine görsel kayma oluşabilir.
3. Tab/language değişimlerinde veri temizlenip yeniden yükleniyor (`setSectionsByGuide(...[])`, `setSections(...)`), bu da içerik yüksekliğini anlık değiştiriyor.
4. `GuideLanguageSelector` aktif guide değişince kendi dil listesini yeniden çekiyor; bu sırada üst blokların yüksekliği değişebiliyor.

Uygulama planı:

1. `src/pages/AudioAccess.tsx`
- `MultiTabAudioPlayer` üzerindeki gereksiz `key` prop’unu kaldır.
- Hero + language selector + player alanını tek bir stabil içerik kolonuna çevir.
- Player container’a sabit değil, korumalı bir outer wrapper ver: geçiş sırasında alan küçülmesin.
- Gerekirse guide başlık/açıklama alanı için de minimum yükseklik tanımla; dil değişiminde üst alan zıplamasın.

2. `src/components/MultiTabAudioPlayer.tsx`
- Mevcut `min-h-[400px]` yaklaşımını dinamik yükseklik korumasına yükselt.
- Aktif tab content yüksekliğini `ref` ile ölçüp wrapper’a `style={{ minHeight }}` uygula.
- Tab değişiminden hemen önce mevcut content yüksekliğini kilitle; yeni içerik render olduktan sonra kontrollü güncelle.
- `hidden` yerine layout’u çökertmeyen bir görünürlük stratejisi kullanmayı değerlendir: aktif olmayan content’leri absolute/inert tarzında saklayıp wrapper yüksekliğini aktif içerikten yönet.
- `onValueChange` içindeki scroll restore kalsın ama yalnız başına çözüm gibi davranmasın; esas çözüm layout stabilizasyonu olsun.

3. Dil değişimi akışını stabilize et
- Ana guide için `AudioAccess.tsx` içinde, linked guide için `MultiTabAudioPlayer.tsx` içinde “önce eski içerik dursun, yeni veri gelince swap et” modeli kullan.
- Yani kullanıcı dil değiştirince mevcut chapter listesi hemen boşaltılmasın.
- Yeni dil verisi gelene kadar audio-temalı inline loading overlay gösterilsin; içerik alanı boşalıp küçülmesin.

4. `src/components/GuideLanguageSelector.tsx`
- Dil chip alanının yüksekliğini daha öngörülebilir yap.
- Loading sırasında `null` dönmek yerine küçük sabit yükseklikli placeholder/inline loader kullan.
- Böylece dil listesinin kaybolup tekrar gelmesinden kaynaklanan üst blok zıplaması engellenir.

5. AudioAccess mobil özel iyileştirme
- Sticky top bar, hero, language picker ve player arasında spacing değerlerini sabitle.
- `animate-fade-in`, `animate-scale-in` gibi giriş animasyonlarının tab/language geçişlerinde istemeden yeniden tetiklenmediğini kontrol et; gerekiyorsa sadece ilk sayfa yüklemesinde çalışacak şekilde sınırlandır.
- Özellikle mobilde blur hero alanı ile content başlangıcı arasında reflow oluşturan class’lar sadeleştirilsin.

6. Güvenli kapsam
- `NewSectionAudioPlayer.tsx`, audio playback mantığı, source çözümü ve chapter play/pause akışı korunacak.
- Değişiklik sadece render stabilitesi, loading swap stratejisi ve container ölçüm mantığında olacak.

Beklenen sonuç:
- Guide başlığına tıklayınca mobilde içerik “çekilip bırakılıyor” gibi görünmeyecek.
- Dil değişiminde chapter listesi boşalıp sayfa sıçramayacak.
- AudioAccess sayfası genel olarak iOS-vari, daha sabit ve daha “native” hissedecek.

Etkilenecek dosyalar:
- `src/pages/AudioAccess.tsx`
- `src/components/MultiTabAudioPlayer.tsx`
- `src/components/GuideLanguageSelector.tsx`
