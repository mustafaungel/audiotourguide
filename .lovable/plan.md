

## Plan: Audio Playback Düzeltme + Bağlı Rehber İyileştirmesi

### Sorun 1: Hiçbir yerde ses çalmıyor

**Kök Neden:** `NewSectionAudioPlayer.tsx` satır 184'te `crossOrigin = 'anonymous'` ayarlanıyor. Supabase storage URL'leri CORS header'ları göndermediğinde bu sessizce hata veriyor ve ses yüklenmiyor. Aynı zamanda `useSpotifyAudio.ts`'deki `play()` fonksiyonu `async` — `await loadAudioSource()` çağrısı kullanıcı gesture bağlamını kırıyor.

**Düzeltme:**

1. **`src/components/NewSectionAudioPlayer.tsx`** — `crossOrigin = 'anonymous'` satırını kaldır (satır 184)
2. **`src/hooks/useSpotifyAudio.ts`** — `play()` fonksiyonunda Audio nesnesini senkron oluştur, `src` atama ve `play()` çağrısını `await loadAudioSource` sonrasında değil, doğrudan gesture context'inde yap. `loadAudioSource`'u senkron URL çözümleme ile değiştir (zaten `resolveAudioUrl` pattern'i var, async Supabase signed URL'e gerek yok — public URL yeterli).

### Sorun 2: Bağlı rehberler için iyileştirme eksik

`MultiTabAudioPlayer` → `BottomSheet` içinde `NewSectionAudioPlayer` render ediyor. Bu player'ın içindeki MiniPlayer ve ExpandedPlayer zaten çalışıyor ama BottomSheet içinde `position: fixed` öğeler z-index çakışması yaşayabilir.

**Düzeltme:**

3. **`src/components/MultiTabAudioPlayer.tsx`** — BottomSheet içindeki `NewSectionAudioPlayer`'a `guideImageUrl` prop'unu her linked guide için de ilet (şu an sadece main guide image geçiriliyor, linked guide'ların kendi image'ları yok). Linked guide image'ını fetch et.

### Teknik Değişiklikler

**`src/hooks/useSpotifyAudio.ts`:**
- `loadAudioSource` fonksiyonunu senkron hale getir — `createSignedUrl` yerine `getPublicUrl` kullan (senkron, await yok)
- `play()` içinde Audio oluşturma → src atama → play() zincirini tek senkron akışta yap
- Async kısmı sadece fallback olarak tut

**`src/components/NewSectionAudioPlayer.tsx`:**
- `audioRef.current.crossOrigin = 'anonymous'` satırını sil
- Bu tek satır değişikliği CORS hatasını çözer

**`src/components/MultiTabAudioPlayer.tsx`:**
- Linked guide'ların image_url'lerini `loadLinkedGuides` sırasında çek
- `LinkedGuide` interface'ine `image_url` ekle
- BottomSheet içindeki `NewSectionAudioPlayer`'a linked guide'ın kendi image'ını geçir

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/NewSectionAudioPlayer.tsx` | `crossOrigin` kaldır |
| `src/hooks/useSpotifyAudio.ts` | Senkron URL çözümleme, gesture context koruması |
| `src/components/MultiTabAudioPlayer.tsx` | Linked guide image desteği |

