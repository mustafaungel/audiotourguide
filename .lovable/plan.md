

## Plan: Drawer Kaydırma ve Tam Ekran Kayma Düzeltmesi

### Kök Sorun Analizi

**Sorun 1 — Kaydırma çalışmıyor**: Content div'in `maxHeight`'ı `calc(95vh - 80px)` (~87vh). Ama drawer "half" snap'te açılırken sadece ~60vh'lık alan görünür (sheet 95vh, translateY 35vh → görünen = 65vh). Content alanı 87vh yüksekliğinde ama sadece 65vh görünüyor — taşan kısım ekranın altında, scroll tetiklenmiyor çünkü content container ekrana sığıyor gibi görünüyor.

**Sorun 2 — Drawer tam ekrana kayıyor**: `snapPoints={['half', 'full']}` ile drawer sürükleme ile full'a geçebiliyor. Kullanıcı content'te scroll yapmaya çalışırken parmağı hafif kaydığında drag handle/header'daki touch handlers tetikleniyor ve sheet full snap'e geçiyor.

### Çözüm — `src/components/ui/bottom-sheet.tsx`

**1. maxHeight'ı currentSnap'e göre dinamik hesapla**

Content alanının yüksekliğini sabit 95vh'ye göre değil, görünen alana göre hesapla:
- `half` snap → görünen alan = `65vh`, content maxHeight = `calc(65vh - 80px)` (title varsa) veya `calc(65vh - 28px)` (title yoksa)
- `full` snap → görünen alan = `95vh`, content maxHeight = `calc(95vh - 80px)`
- `mini` snap → görünen alan = `88px`, content maxHeight = minimal

Bu sayede content her zaman görünen alana sığar ve `overflow-y-scroll` gerçekten tetiklenir.

**2. Drag handler'ların content'e bulaşmasını engelle**

Content div'e `onTouchStart` handler