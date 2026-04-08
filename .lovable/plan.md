

## Plan: Bağlı Rehber Player'ı Düzeltme — BottomSheet İçi Uyumluluk

### Problem
Bağlı rehberleri olan turlar (ör: "Hot Air Balloon Tour Introduction") `BottomSheet` içinde `NewSectionAudioPlayer` render ediyor. Ancak MiniPlayer ve ExpandedPlayer `position: fixed` kullanıyor — bu BottomSheet'in kendi `fixed z-50` konumlandırmasıyla çakışıyor:

- **MiniPlayer** (`fixed bottom-0 z-50`) → BottomSheet'in arkasında kalıyor veya BottomSheet kapatılınca görünmüyor
- **ExpandedPlayer** (`fixed inset-0 z-[60]`) → Açılıyor ama BottomSheet scroll lock ile çakışıyor
- Sonuç: Bağlı rehberlerde MiniPlayer/ExpandedPlayer düzgün çalışmıyor

Bağlı rehber olmayan turlar (ör: "Discover Hidden Valleys") ise doğrudan sayfaya render edildiği için sorunsuz çalışıyor.

### Çözüm

`NewSectionAudioPlayer`'a bir `insideSheet` prop'u ekle. BottomSheet içindeyken:
- **MiniPlayer**: `fixed` yerine BottomSheet'in altına yapışık (`sticky`) olarak render edilir
- **ExpandedPlayer**: z-index'i yükseltilir (`z-[70]`) ve BottomSheet'i override eder
- `MultiTabAudioPlayer` bu prop'u BottomSheet içindeki player'a geçirir

### Teknik Değişiklikler

**`src/components/NewSectionAudioPlayer.tsx`:**
- `insideSheet?: boolean` prop ekle
- `insideSheet` true ise MiniPlayer'ı `fixed` yerine sheet content'in altında inline/sticky olarak göster
- ExpandedPlayer'ı her durumda Portal ile render et (BottomSheet'in dışında)

**`src/components/MiniPlayer.tsx`:**
- `variant?: 'fixed' | 'inline'` prop ekle
- `inline` modda: `fixed bottom-0` yerine `sticky bottom-0` veya flow içi render
- Görünüm/işlevsellik aynı kalır

**`src/components/ExpandedPlayer.tsx`:**
- z-index'i `z-[70]`'e yükselt (BottomSheet z-50'nin üstünde)
- `ReactDOM.createPortal` ile `document.body`'ye render et → BottomSheet DOM'undan bağımsız

**`src/components/MultiTabAudioPlayer.tsx`:**
- BottomSheet içindeki `NewSectionAudioPlayer`'a `insideSheet={true}` geçir
- Standalone render'da (linkedGuides.length === 0) `insideSheet` geçirme

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/NewSectionAudioPlayer.tsx` | `insideSheet` prop, MiniPlayer variant seçimi |
| `src/components/MiniPlayer.tsx` | `variant` prop — inline/fixed mod |
| `src/components/ExpandedPlayer.tsx` | z-index artır, Portal ile render |
| `src/components/MultiTabAudioPlayer.tsx` | `insideSheet={true}` prop geçir |

