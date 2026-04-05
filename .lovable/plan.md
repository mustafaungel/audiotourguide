

## Plan: Drawer Animasyonu Düzeltme + Main Guide Drawer Olarak Açılması

### Sorun 1: BottomSheet Animasyonu Kötü
`BottomSheet` bileşeni `open` false olduğunda `return null` yapıyor (satır 136). Bu yüzden kapanırken hiç animasyon yok — DOM'dan anında siliniyor. Açılırken de sadece Tailwind `animate-in slide-in-from-bottom-2` var ama bu çok küçük bir hareket (8px). Gerçek bir slide-up animasyonu yok.

### Çözüm 1: Mount/unmount yerine CSS transform ile açılıp kapanma
- `open` false olduğunda `return null` yapmak yerine, bileşeni her zaman render et
- `translateY(100%)` ile ekran dışına it (kapalı), `translateY(0)` ile yerine getir (açık)
- Transition: `transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)`
- Backdrop da `opacity` transition ile fade in/out yapsın
- Unmount için: transition bitince (`onTransitionEnd`) gerçekten DOM'dan kaldır veya her zaman mount tut

### Sorun 2: Main Guide Her Zaman Inline, Drawer Olarak Açılmıyor
Şu anki kodda main guide her zaman sayfada inline render ediliyor (satır 266-270). Main guide pill'e tıklayınca sadece sheet kapanıyor, ama main guide zaten hep görünür. Kullanıcı tüm guide'ların eşit şekilde drawer'da açılmasını istiyor.

### Çözüm 2: Main guide'ı da drawer'da aç
- Main guide inline render'ı kaldır
- Başlangıçta hiçbir pill seçili olmasın (tüm pill'ler pasif stilde)
- Main guide pill'e tıklayınca: `selectedGuide = 'main'`, `sheetOpen = true` → main guide BottomSheet'te açılır
- Linked guide pill'e tıklayınca: mevcut davranış (linked guide BottomSheet'te açılır)
- Sheet kapatılınca: hiçbir pill seçili değil

### Değişiklik — `src/components/ui/bottom-sheet.tsx`

1. **Her zaman render et**, `if (!open) return null` kaldır
2. Backdrop ve sheet'e `open` state'ine göre conditional class/style:
   - Kapalı: backdrop `opacity-0 pointer-events-none`, sheet `translate-y-full`
   - Açık: backdrop `opacity-100`, sheet `translate-y-0`
3. `transition` property'lerini hem açılma hem kapanma için uygula
4. Backdrop'a `transition-opacity duration-300` ekle

### Değişiklik — `src/components/MultiTabAudioPlayer.tsx`

1. **Inline main guide render'ı kaldır** (satır 265-270)
2. **Yeni state:** `selectedGuideType: 'main' | 'linked' | null` (veya mevcut state'leri refactor et)
3. **Main guide pill onClick:** `setSheetOpen(true)` + selected guide bilgisini main olarak ayarla
4. **BottomSheet içeriği:** main veya linked guide'a göre doğru player'ı render et
5. **Pill styling:** Hiçbir pill başlangıçta aktif olmasın, sadece sheet açıkken ve o guide seçiliyken aktif stil

### Etkilenen Dosyalar
- `src/components/ui/bottom-sheet.tsx` — animasyon düzeltmesi
- `src/components/MultiTabAudioPlayer.tsx` — main guide drawer mantığı

