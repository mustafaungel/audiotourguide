

## Plan: Mobil Tıklama UX + AudioAccess Dil Değişikliği Layout Shift Düzeltmeleri

### Sorun 1: Mobil GuideCard Tıklama Problemi
`GuideCard.tsx` satır 159-172'de bir play button overlay var: `absolute inset-0` ile tüm image alanını kaplıyor. `opacity-0 group-hover:opacity-100` kullanıyor — mobilde hover olmadığı için bu overlay **görünmez ama pointer event'leri yakalıyor**. Kullanıcı resme tıkladığında aslında bu görünmez overlay'e tıklıyor ve çalışıyor, ama metin/fiyat/buton alanına tıkladığında da Card onClick çalışıyor. Asıl sorun **görsel**: mobilde kartın tıklanabilir olduğu belli olmuyor, hover efekti yok, active/pressed state yok.

### Sorun 2: AudioAccess Dil Değişikliğinde Layout Shift
`AudioAccess.tsx` satır 695'te `MultiTabAudioPlayer`'ın `key` prop'u `selectedLanguage` içeriyor. Dil değiştiğinde **tüm player unmount/remount** oluyor → tam bir layout kayması. Ayrıca `handleLanguageChange` async olarak yeni section'ları fetch ediyor — bu sürede sections boşalıyor ve player kapanıp açılıyor.

---

### Değişiklik 1: `src/components/GuideCard.tsx` — Mobil tıklama UX iyileştirmesi

- Play overlay'e `pointer-events-none` ekle (tüm click'ler Card'ın onClick'ine gitsin)
- Overlay'deki Button'ın ayrı onClick'ini kaldır (zaten Card onClick var)
- Karta `active:scale-[0.98]` ekle → mobilde basınca hafif küçülme efekti (pressed state)
- `cursor-pointer` zaten var, ek olarak `select-none` ekle

### Değişiklik 2: `src/pages/AudioAccess.tsx` — Dil değişikliği kayma düzeltmesi

- `MultiTabAudioPlayer`'ın `key` prop'undan `selectedLanguage`'ı **kaldır** → dil değiştiğinde player unmount/remount olmasın
- `handleLanguageChange`'de sections'ı **boşaltmadan** yeni sections'ı fetch et: eski sections gösterilmeye devam etsin, yeni veri geldiğinde değişsin
- Player container'a `min-h-[400px]` ver (mevcut `min-h-[200px]` yetersiz)

### Değişiklik 3: `src/components/FeaturedGuides.tsx` — Carousel kart tıklama UX

- Kart container'a `active:scale-[0.98]` ekle → mobilde pressed state

---

### Etkilenen Dosyalar
- `src/components/GuideCard.tsx` — overlay pointer-events fix + active state
- `src/pages/AudioAccess.tsx` — key prop fix + sections transition stabilizasyonu
- `src/components/FeaturedGuides.tsx` — active state

### Sonuç
- Mobilde kartlara tıklandığında görsel geri bildirim (pressed effect)
- Dil değişikliğinde sıfır layout shift — player yerinde kalır, sadece içerik güncellenir

