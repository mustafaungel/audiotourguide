
## Plan: Dil Seçiminde İçerik Yukarı Kaysın

### Sorun
`invisible` class kullanıldığında gizlenen butonlar hâlâ yer kaplıyor, ekran boşta kalıyor ve alttaki içerik yukarı kaymıyor.

### Çözüm
`invisible` yerine `hidden` (display: none) kullan. Seçili butonun boyutunu sabit tutmak için **sabit genişlik/yükseklik** uygula — grid yerine `flex-wrap` kullanarak, buton boyutu grid sütununa bağlı olmaktan çıksın.

### Değişiklik — `src/components/GuideLanguageSelector.tsx`

**1. Grid → flex-wrap geçişi (satır 113-116):**
- `grid grid-cols-2` → `flex flex-wrap gap-2`
- Butonlara sabit minimum genişlik ekle: `min-w-[calc(50%-0.25rem)]` (2 sütun efekti)

**2. Gizleme: `invisible` → `hidden` (satır 130):**
- `isHidden && "invisible"` → `isHidden && "hidden"`
- Bu sayede gizlenen butonlar yer kaplamaz, içerik yukarı kayar

**3. Buton boyut sabitleme:**
- Seçili buton flex-wrap'te kendi doğal boyutunda kalır — grid sütununa bağlı olmadığından boyut değişmez

### Etkilenen Dosya
- `src/components/GuideLanguageSelector.tsx` — ~3 satır değişiklik

### Sonuç
- Dil seçilince diğerleri kaybolur, alan daralır, alttaki içerik yukarı kayar
- Seçili buton aynı boyutta kalır (flex item olarak doğal genişliğini korur)
- Tekrar tıklanınca diğer diller geri gelir, alan genişler
