

## Plan: BottomSheet İçindeki MiniPlayer Konumlandırma Düzeltmesi

### Problem
BottomSheet içinde MiniPlayer `sticky bottom-0` olarak scroll content'in **içinde** render ediliyor. Scroll container'ın `maxHeight` ve `overflow-y-scroll` kısıtlaması nedeniyle MiniPlayer düzgün yapışmıyor — content'in altında kalıyor, kısmen kesiliyorsa ya da çok aşağıda görünüyor. Standalone guide'larda (`fixed bottom-0`) sorun yok çünkü viewport'a sabitleniyor.

### Çözüm
MiniPlayer'ı BottomSheet'in scroll container'ından **çıkarıp**, sheet'in flex layout'unda scroll div'in altına sabitlemek. Bunun için:

1. **BottomSheet'e footer slot ekle** — scroll content div'inden sonra, sheet flex column'ının altında render edilecek bir alan
2. **Scroll content maxHeight'ı footer varken küçült** — MiniPlayer (~64px) için yer aç
3. **NewSectionAudioPlayer** — MiniPlayer'ı `createPortal` ile BottomSheet footer alanına render et

### Teknik Değişiklikler

**`src/components/ui/bottom-sheet.tsx`:**
- Sheet div'inin içine, scroll content div'inden sonra `<div id="bottom-sheet-footer" />` ekle
- `maxHeight` hesaplamasında footer alanı için 64px daha çıkar (veya footer mevcutsa otomatik hesapla)

**`src/components/NewSectionAudioPlayer.tsx`:**
- `insideSheet` true ise MiniPlayer'ı `createPortal(miniPlayer, document.getElementById('bottom-sheet-footer'))` ile render et
- Böylece MiniPlayer scroll alanının dışında, sheet'in altında sabit kalır

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/ui/bottom-sheet.tsx` | Footer container div ekle, maxHeight ayarla |
| `src/components/NewSectionAudioPlayer.tsx` | insideSheet modda MiniPlayer'ı portal ile footer'a render et |

