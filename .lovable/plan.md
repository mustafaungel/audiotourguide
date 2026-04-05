
Hedef: Audio Access akışını değiştirmeden, mobil drawer ve dil seçimindeki kalite sorunlarını düzeltmek.

1. Drawer’ın giriş/çıkış animasyonunu gerçekten çalışır hale getireceğim (`src/components/ui/bottom-sheet.tsx`)
- Mevcut kök sorun: sheet açılırken DOM’a zaten final konumunda mount oluyor; bu yüzden giriş animasyonu görünmüyor.
- Çözüm: `rendered` ve `visible` durumlarını ayıracağım.
  - Açarken önce kapalı halde mount
  - Sonraki frame’de görünür hale getir
  - Kapanırken önce görünmez yap, transition bitince unmount et
- Böylece açılış/kapanış gerçekten `translateY + opacity` ile akacak.

2. “Sayfa kayıyor” hissini kaldıracağım (`src/components/ui/bottom-sheet.tsx`)
- Mevcut sorun: `body`’yi `position: fixed` yapıp `scrollY` restore etmek mobilde zıplama hissi yaratıyor.
- Çözüm: daha hafif scroll lock kullanacağım:
  - `html/body overflow: hidden`
  - scroll pozisyonunu zorla geri yazmayan yaklaşım
  - sheet içinde `overscroll-behavior: contain`
- Sonuç: drawer açılıp kapanırken arka plan sabit kalacak.

3. Drawer hareketini daha kaliteli ama hafif tutacağım
- Mevcut `transform` tabanlı yapı korunacak; `blur` gibi ağır efektler eklenmeyecek.
- Açılış/kapanış easing’i ve süreleri daha doğal hale getirilecek.
- Drag sırasında sadece `transform` güncellenecek, re-render yükü artırılmayacak.
- Header/handle drag davranışı ile içerik scroll davranışı daha temiz ayrılacak; böylece mobilde “takılıyor” hissi azalacak.

4. Dil seçimini daha anlaşılır yapacağım (`src/components/GuideLanguageSelector.tsx`)
- Akış aynı kalacak: diller açılacak, seçim sonrası daralacak.
- Seçili dili daha net göstereceğim:
  - daha güçlü selected background/border/ring
  - check ikonunu daha belirgin badge gibi kullanma
  - üst satırda aktif dilin native name bilgisini gösterme
- Böylece collapse sonrası hangi dilin seçili olduğu anında anlaşılacak.

5. Dil seçimi animasyonunu daha rafine hale getireceğim
- Mevcut sütun koruma mantığı bozulmayacak.
- Seçili olmayan butonlar sert kaybolmak yerine `opacity + scale + hafif offset` ile çıkacak.
- Container daralması korunacak ama animasyon daha “premium” hissedecek.
- Performans için ağırlık yine `transform/opacity` tarafında kalacak.

Etkilenen dosyalar
- `src/components/ui/bottom-sheet.tsx`
- `src/components/GuideLanguageSelector.tsx`

Beklenen sonuç
- Drawer mobilde gerçekten smooth açılıp kapanacak
- Arka plan zıplamayacak
- Seçimler daha net algılanacak
- Tasarım ve mevcut kullanıcı akışı korunacak
