
Sorunun hâlâ çözülmemesinin nedeni, şu anki düzeltmenin kök sebebi tam kapatmaması. Kodda kalan gerçek problemler bunlar:

1. `MultiTabAudioPlayer` yükseklik kilidini sadece `onValueChange` içinden yapıyor. Ama tab değişimi her zaman bu yoldan olmuyor:
- `openLinkedGuide` custom event’i doğrudan `setActiveTab(...)` çağırıyor
- dil değişiminde içerik async yenileniyor ama yükseklik tekrar kilitlenmiyor

2. Yükseklik kilidi zaman bazlı açılıyor:
- `setTimeout(() => setLockedHeight(undefined), 100)`
- Mobilde veri geç gelirse veya içerik yeniden ölçülürse, kilit erken açılıyor ve sayfa tekrar “çöküp büyüyor”

3. `forceMount + hidden` yaklaşımı tek başına yetmiyor:
- aktif panel dışındaki içerik `display: none` oluyor
- yeni aktif panel ilk anda boş/eksik veri ile render olursa wrapper gerçek yüksekliği koruyamıyor

4. `GuideLanguageSelector` hâlâ `guideId` ve `activeGuideId` değişince yeniden fetch yapıyor; bu sırada buton sayısı/satır yapısı değişiyor ve hero altı zıplıyor.

5. `NewSectionAudioPlayer` boş section geldiğinde direkt “no content” render ediyor. Async geçişte bu ara durum görünürse, content yüksekliği dramatik düşüyor.

Uygulama planı:

1. `src/components/MultiTabAudioPlayer.tsx`
- Tab değişimini tek bir merkez fonksiyona topla: hem tab click, hem `openLinkedGuide` event’i aynı `switchTabWithLayoutLock(...)` fonksiyonunu kullansın.
- `setTimeout(100)` ile unlock yapısını kaldır.
- Her panel için `ref` tutup aktif panel yüksekliğini gerçekten ölç.
- Kilidi, yeni aktif panel ölçülene kadar koru; ölçüm geldikten sonra güncelle.
- `hidden` yerine layout’u daha stabil yöneten yaklaşım kullan:
  - aktif panel normal akışta
  - pasif paneller `absolute inset-0 invisible pointer-events-none` gibi ölçülebilir ama akışı bozmayan yapıda
- Gerekirse `ResizeObserver` ile aktif içeriğin boyu değiştikçe wrapper `minHeight` senkronize edilsin.

2. `src/pages/AudioAccess.tsx`
- Hero + language selector + player alanını tek bir sabit içerik stack’i olarak koru.
- Language değişiminde ana guide content’i boşaltma yerine “stale while revalidate” mantığını daha katı uygula:
  - mevcut sections ekranda kalsın
  - yeni veri hazır olduğunda tek seferde swap olsun
- Guide title/description alanına küçük ama sabit bir min-height ver; dil değişiminde üst blok boyu aniden küçülmesin.

3. `src/components/GuideLanguageSelector.tsx`
- `activeGuideId` değişiminde tekrar fetch yüzünden oluşan zıplamayı azalt:
  - eski dil butonlarını ekranda tut
  - yeni liste gelene kadar sadece loading overlay / disabled state göster
- `availableLanguages.length < 1` için `null` dönmek yerine sabit yükseklikli boş placeholder dön.
- Grid satır sayısı değişse bile container minimum yüksekliğini koru.

4. `src/components/NewSectionAudioPlayer.tsx`
- `!sections.length` durumunda doğrudan kısa “no content” mesajı yerine sabit yükseklikli state göster.
- Geçiş sırasında eski sections görünmeye devam edecek şekilde parent akışıyla uyumlu hale getir.
- Böylece async fetch anında chapter card alanı bir anda küçülmez.

5. `src/components/ChapterList.tsx`
- Kart listesinin yüksekliğini daha stabil tutmak için header + list spacing değerlerini sabitle.
- Mevcut chapter ile diğer chapter’lar arasındaki border/shadow farkını korurken yükseklik değiştiren stil farklarını azalt.

Beklenen sonuç:
- Mobilde guide/tab seçiminde içerik yukarı-aşağı sıçramaz
- Dil değişiminde sayfa “bozulmuş” gibi küçülüp büyümez
- Hero, language selector ve chapter list aynı dikey ritimde kalır
- Geçişler daha native ve sabit hissedilir

Etkilenecek dosyalar:
- `src/components/MultiTabAudioPlayer.tsx`
- `src/pages/AudioAccess.tsx`
- `src/components/GuideLanguageSelector.tsx`
- `src/components/NewSectionAudioPlayer.tsx`
- `src/components/ChapterList.tsx`
