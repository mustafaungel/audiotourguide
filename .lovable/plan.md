

## Plan: Dil Seçimi Açık Gösterim + Logo Cache ile Anlık Yükleme

### Sorun 1: Çift Logo → localStorage Cache Çözümü

Sorun: Branding verisi Supabase'den gelene kadar `FallbackIcon` gösteriliyor, sonra gerçek logo yükleniyor → iki farklı logo görünüyor.

Boş div göstermek yerine **localStorage cache** kullanacağız: Logo URL'si bir kez Supabase'den geldiğinde localStorage'a kaydedilecek. Sonraki sayfa yüklemelerinde BrandingContext, Supabase sorgusu bitmeden önce cache'teki değeri kullanacak → logo anında görünecek, FallbackIcon hiç gösterilmeyecek.

**Dosya: `src/contexts/BrandingContext.tsx`**
- `defaultBranding` yerine `localStorage`'dan okunan cached branding ile başla
- Supabase sorgusu tamamlandığında hem state'i hem cache'i güncelle
- İlk yüklemede cache varsa `loading` baştan `false` olacak

**Dosya: `src/components/ResponsiveLogo.tsx`**
- Değişiklik yok — cache sayesinde `logoUrl` zaten ilk render'da dolu olacak, FallbackIcon hiç tetiklenmeyecek

---

### Sorun 2: Dil Seçimi → Açık Butonlar

**Dosya: `src/components/GuideLanguageSelector.tsx`**
- BottomSheet mekanizmasını kaldır
- Dilleri `flex flex-wrap gap-2` ile yatay bayrak+isim butonları olarak direkt göster
- Seçili dil vurgulanacak (primary border/background)
- Tıklayınca direkt `onLanguageChange` çağrılacak

```text
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🇺🇸 English │ │ 🇹🇷 Türkçe │ │ 🇪🇸 Español │
└──────────┘ └──────────┘ └──────────┘
  (seçili)
```

### Etkilenen Dosyalar
- `src/contexts/BrandingContext.tsx` — localStorage cache ekle
- `src/components/GuideLanguageSelector.tsx` — bottom sheet → inline butonlar

### Risk
Düşük. Cache mekanizması sadece performans iyileştirmesi, mevcut işlevsellik korunuyor.

