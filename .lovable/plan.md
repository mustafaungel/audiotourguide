
Mobilde ThemeToggle boyutunu küçültelim — masaüstünde mevcut boyut korunur.

### Değişiklik — `src/components/ThemeToggle.tsx`

Track ve knob için responsive boyutlar:

| Eleman | Mobil | Desktop (sm+) |
|---|---|---|
| Track | `h-[26px] w-[48px]` | `h-[32px] w-[60px]` |
| Knob | `h-[20px] w-[20px]` | `h-[26px] w-[26px]` |
| Knob translate (light→dark) | `3px → 25px` | `3px → 31px` |
| Sun/Moon ikon | `11px` | `14px` |

Tailwind ile: `h-[26px] w-[48px] sm:h-[32px] sm:w-[60px]` gibi.

Knob translate için `sm:` varyantları kullanılacak. Touch target (44px min) için button'a görünmez padding değil — buton zaten tıklanabilir alan; mobilde 26x48 yeterli kontrol sağlar (iOS Switch standart 31x51, biz 26x48 ile biraz daha kompakt).

Yıldız/bulut süslerinin pozisyonları da mobile için hafifçe içeri çekilecek (left-1.5/right-1).

### Etkilenen Dosya
- `src/components/ThemeToggle.tsx` (sadece className güncellemeleri, ~8 satır)

### Performans
Sadece boyut değişiklikleri — animasyon ve transformlar aynı, GPU yükü sıfır.
