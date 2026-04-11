

## Sticky Header Başlık Taşması Çözümü

### Problem
Uzun rehber başlıkları (ör. "Cappadocia : Goreme Open Air Muse...") sticky header'da `truncate` ile kesiliyor ve okunmuyor. Mobilde (390px) geri butonu (w-11) + ikon (w-4) + bayrak ikonu alan kaplıyor, başlığa az yer kalıyor.

### Çözüm
Başlığı tek satırda kesmek yerine **iki satıra izin ver** — `truncate` yerine `line-clamp-2` kullan. Bu sayede uzun başlıklar 2 satıra yayılır, yine de taşmaz.

### Değişiklik — `src/pages/GuideDetail.tsx` (satır 671)

```
Önce:  <span className="text-sm font-bold font-heading min-w-0 truncate">
Sonra: <span className="text-sm font-bold font-heading min-w-0 line-clamp-2 leading-tight">
```

- `line-clamp-2`: Maksimum 2 satır, fazlası `...` ile kesilir
- `leading-tight`: Satır yüksekliğini sıkıştırarak header'ın çok büyümesini önler
- Header yüksekliği ~4-6px artar (kabul edilebilir)

Tek dosya, tek satır değişikliği.

