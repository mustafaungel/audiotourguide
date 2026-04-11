

## Library Loading Skeleton + GuideDetail Skeleton İyileştirmesi

### Mevcut Durum

| Sayfa | Themed Skeleton | Durum |
|-------|----------------|-------|
| Index | ✅ AudioGuideLoader card | Tamam |
| Guides | ✅ AudioGuideLoader card | Tamam |
| FeaturedGuides | ✅ AudioGuideLoader card | Tamam |
| Countries | ✅ AudioGuideLoader grid | Tamam |
| CountryDetail | ✅ AudioGuideLoader card | Tamam |
| AudioAccess | ✅ AudioGuideLoader page | Tamam |
| GuideDetail | ⚠️ Kısmen themed — sidebar düz gri skeleton | İyileştirilecek |
| Library | ❌ Loading state yok — `loading=true` iken hiçbir şey gösterilmiyor | Eklenecek |

### Yapılacak Değişiklikler

**1. `src/pages/Library.tsx`**
- `loading` state'i true iken AudioGuideLoader `variant="card"` göster
- Kullanıcı verisi yüklenirken boş ekran yerine themed skeleton kartlar görünsün

**2. `src/pages/GuideDetail.tsx`** (satır 500-540 arası loading bloğu)
- Sidebar skeleton'a kulaklık ikonu ve audio wave ekle
- Düz gri `animate-pulse` divleri AudioGuideLoader tarzı elemanlara dönüştür
- Tutarlı görünüm: hem ana içerik hem sidebar audio-themed

### Teknik Özet

```
2 dosya:
  src/pages/Library.tsx — loading state için AudioGuideLoader variant="card" ekle
  src/pages/GuideDetail.tsx — sidebar skeleton'ı audio-themed yap
```

