

## GuideDetail Sticky Header — Featured Amber Tema Uyumu

### Problem
Featured rehberlerin sticky header'ında `bg-amber-900/40` kullanılıyor. Bu renk koyu kahverengi-amber tonunda ve sayfa genelinde kullanılan parlak altın/amber gradyanlarıyla (ör. `from-amber-500 to-yellow-500`) uyumsuz. Cam efekti çalışıyor ama renk tonu yanlış — sayfadaki diğer amber öğeler sıcak altın tonlarında iken header soğuk/koyu görünüyor.

### Çözüm
Sticky header arka planını featured temanın altın tonlarına uyumlu hale getir:

**`src/pages/GuideDetail.tsx` (satır 665)**

```
Önce:  bg-amber-900/40 dark:bg-amber-950/50
Sonra: bg-amber-500/15 dark:bg-amber-900/40
```

- Light mode: `bg-amber-500/15` — sıcak altın tonu, düşük opaklık, cam efekti belirgin
- Dark mode: `bg-amber-900/40` — koyu modda biraz daha yoğun ama yine de şeffaf
- `backdrop-blur-xl` korunacak
- Border'ı da featured temaya uyumlu yapmak için: `border-amber-500/20` (featured durumunda)

### Değişecek dosya
1. `src/pages/GuideDetail.tsx` — satır 665, featured sticky header renk değerleri

