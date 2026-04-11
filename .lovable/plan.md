

## Düzeltme: Sticky Header Arka Plan Bozukluğu

### Problem

Sticky header'da arka plan renkleri çok düşük opaklıkta:
- Featured: `from-amber-500/10 to-yellow-500/5` (neredeyse saydam)
- Normal: `bg-background/95` (hafif saydam)

Altından scroll eden içerik (görsel, metin, badge) bulanık şekilde görünüyor ve kirli bir efekt yaratıyor.

### Çözüm

Arka planı tam opak yap:
- Featured: gradient üzerine solid bir katman ekle → `bg-background dark:bg-[#1a1206]` + gradient overlay
- Normal: `bg-background/95` → `bg-background`

`backdrop-blur-md` korunabilir ama artık gerekli olmayacak — yine de geçiş yumuşaklığı için kalabilir.

### Teknik

```
src/pages/GuideDetail.tsx (satır 665)

Önce:
backdrop-blur-md ... bg-gradient-to-r from-amber-500/10 to-yellow-500/5 : bg-background/95

Sonra:
backdrop-blur-md ... bg-amber-950/95 dark:bg-amber-950/95 : bg-background
```

Featured guide'lar için `bg-amber-950/95` ile amber tonunu koruyup opaklığı artırıyoruz. Normal guide'lar tam opak `bg-background` olacak. Böylece altından geçen içerik hiçbir koşulda görünmez.

### Değişecek dosya
- `src/pages/GuideDetail.tsx` — tek satır (665)

