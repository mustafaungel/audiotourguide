

## GuideDetail Sticky Header — Cam Efekti Düzeltmesi

### Problem
Sticky header'da `bg-amber-950/70` kullanılıyor. `amber-950` çok koyu bir renk (#451a03) olduğundan, %70 opaklıkta bile neredeyse tamamen opak görünüyor. Arka plandaki içerik görünmüyor ve cam/glass efekti hissedilmiyor.

Aynı şekilde normal (featured olmayan) rehberlerde `bg-background/70` doğru çalışıyor olmalı ama featured rehberlerdeki amber sorunu belirgin.

### Çözüm
Featured rehberlerde amber tonu çok daha düşük opaklığa çekilmeli. Light modda daha açık bir amber, dark modda daha şeffaf bir amber kullanılmalı:

**`src/pages/GuideDetail.tsx` (satır 665)**

```
Önce:  bg-amber-950/70 dark:bg-amber-950/70
Sonra: bg-amber-900/40 dark:bg-amber-950/50
```

- Featured: `bg-amber-900/40 dark:bg-amber-950/50` — daha şeffaf, cam etkisi hissedilir
- `backdrop-blur-xl` zaten mevcut, korunacak
- Normal rehberler: `bg-background/70` zaten doğru, değişmeyecek

### Değişecek dosya
1. `src/pages/GuideDetail.tsx` — satır 665, sadece featured amber opaklık değeri

