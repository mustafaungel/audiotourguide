

## Plan: Bottom Sheet Kaydırma Sorunlarını Düzelt

### Sorunlar
1. **Sonsuz kaydırma**: Touch event handler'ları tüm sheet div'ine bağlı — içerik alanında kaydırma yaparken sheet'in kendisi de sürükleniyor, içerik sınırsız kaydırılıyor gibi hissettiriyor.
2. **Arka plan kaydırma**: iOS'ta `overflow: hidden` tek başına yetmiyor — drawer açıkken arka sayfayı parmakla kaydırmak hâlâ mümkün.

### Çözüm — `src/components/ui/bottom-sheet.tsx`

**1. Touch handler'ları sadece drag handle'a taşı:**
- `onTouchStart/Move/End` event'lerini sheet container'dan kaldır
- Sadece drag handle div'ine (`w-10 h-1` bar) ve header alanına bağla
- İçerik alanı (`overflow-y-auto`) normal scroll davranışını korur

**2. iOS body scroll lock güçlendir:**
- Drawer açıkken body'ye `position: fixed; width: 100%; top: -scrollY` ekle
- Kapanınca scroll pozisyonunu geri yükle
- Backdrop'a `touch-action: none` ekle

**3. İçerik alanına `overscroll-behavior: contain` ekle:**
- Scroll sınırına ulaşınca olayın arkadaki sayfaya geçmesini engeller

### Etkilenen Dosya
- `src/components/ui/bottom-sheet.tsx`

