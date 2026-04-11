

## Sticky Header Dalgalanma (Flicker) Sorunu Çözümü

### Problem
`backdrop-blur` filtresi her karede altındaki pikselleri yeniden örnekler. Scroll sırasında sticky header'ın konumu değişirken bu yeniden örnekleme görsel bir "dalgalanma" (flicker/shimmer) yaratıyor — özellikle mobilde belirgin.

### Çözüm
Cam efektini koruyarak, GPU kompozit katmanı oluşturup dalgalanmayı engellemek:

1. **`will-change: transform` + `transform: translateZ(0)`** ekleyerek sticky header'ı kendi GPU katmanına taşımak. Bu, backdrop-blur'un her karede yeniden hesaplanması yerine sabit bir katmanda çalışmasını sağlar.

2. **`-webkit-backdrop-filter`** prefix'ini de ekleyerek Safari uyumluluğunu garanti etmek.

### Değişecek dosyalar

| Dosya | Eklenen class'lar |
|-------|-------------------|
| `src/pages/GuideDetail.tsx` (satır 665) | `will-change-transform transform-gpu` |
| `src/pages/AudioAccess.tsx` (satır 700) | `will-change-transform transform-gpu` |
| `src/components/Navigation.tsx` (satır 41) | `will-change-transform transform-gpu` |

Tailwind'in `transform-gpu` class'ı `transform: translate3d(0,0,0)` uygular — bu, elementi kendi compositing layer'ına taşır. `will-change-transform` ise tarayıcıya bu elementin değişeceğini önceden bildirir.

Cam efekti (backdrop-blur, düşük opaklık) aynen korunacak, sadece render performansı iyileştirilecek.

