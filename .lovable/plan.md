

## Plan: MiniPlayer'a Hızlı Kontrol Tuşları + BottomSheet Portal Düzeltmesi

### Problem 1: MiniPlayer'da kontrol eksikliği
Kullanıcı görseldeki MiniPlayer'da sadece play/pause ve expand var. İleri/geri atlama ve hız kontrolü eksik.

### Problem 2: Bağlı guide'larda MiniPlayer açılmıyor
`createPortal` ile `document.getElementById('bottom-sheet-footer')` kullanılıyor ama BottomSheet henüz DOM'da mount olmamışken veya timing sorunu nedeniyle `null` dönüyor. Bu durumda MiniPlayer hiç render edilmiyor.

### Çözüm

**`src/components/MiniPlayer.tsx`:**
- Yeni prop'lar ekle: `onSkipBack`, `onSkipForward`, `onSpeedChange`, `playbackSpeed`
- Play butonunun soluna `-15s` butonu, sağına `+15s` butonu ekle
- Expand butonunun yerine veya yanına hız göstergesi/butonu ekle (1x → 1.5x → 2x döngüsü)
- Butonlar küçük ve kompakt: `w-8 h-8`, ikonlar `w-3.5 h-3.5`
- Layout: `[image] [title/time] [⏪15] [▶️] [15⏩] [2x] [↑]`

**`src/components/NewSectionAudioPlayer.tsx`:**
- MiniPlayer'a `onSkipBack`, `onSkipForward`, `onSpeedChange`, `playbackSpeed` prop'larını geçir
- Portal timing sorununu düzelt: `useEffect` ile `bottom-sheet-footer` element'inin varlığını izle veya `insideSheet` modda MiniPlayer'ı fallback olarak inline render et (footer element bulunamazsa)
- Portal hesaplamasını IIFE'den `useMemo`/state'e taşı — DOM element kontrolünü render cycle'a bağla

**`src/components/ui/bottom-sheet.tsx`:**
- Footer div'in `id="bottom-sheet-footer"` olarak mount olduğundan emin ol (mevcut — sorun yok)
- Footer div'e minimum yükseklik verme — içi boşken yer kaplamasın, portal ile dolduğunda otomatik genişlesin

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MiniPlayer.tsx` | Skip ±15s butonları, hız döngüsü butonu ekle |
| `src/components/NewSectionAudioPlayer.tsx` | Yeni prop'ları geçir, portal timing düzeltmesi |

