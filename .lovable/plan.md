

## Plan: GuideDetail Player İyileştirme, QR Tab Kaldırma ve Audio Playback Düzeltme

### 1. QR Code Tab Kaldırma
**Dosya:** `src/pages/GuideDetail.tsx`

- TabsList'i `grid-cols-3` → `grid-cols-2` yap
- QR Code TabsTrigger'ı (line 838) kaldır
- QR Code TabsContent bloğunu (lines 939-1060) tamamen sil
- `QrCode` import'unu kaldır (artık kullanılmıyor)
- QR ile ilgili state'ler (`showQRCode`) korunabilir çünkü payment success akışında kullanılıyor

### 2. Volume Bug Düzeltme (Masaüstü Audio Çalmama Sorunu)
**Dosya:** `src/hooks/useSpotifyAudio.ts`

**Kök Neden:** Volume 0-1 aralığında olmalı (HTML5 Audio API) ama SpotifyStylePlayer slider 0-100 aralığında değer gönderiyor. `setVolumeLevel` bu değeri direkt `audio.volume`'a atıyor — geçersiz değer (>1) ses çalmayı engelleyebilir.

- `setVolumeLevel` fonksiyonunda volume'u normalize et: `audio.volume = Math.min(1, Math.max(0, newVolume / 100))`
- State'i de normalize et: `setVolume(Math.min(1, Math.max(0, newVolume / 100)))`
- Alternatif: SpotifyStylePlayer tarafında `/100` yapmak daha temiz — `handleVolumeChange` içinde `setVolumeLevel(vol / 100)` olarak düzelt

**Dosya:** `src/components/SpotifyStylePlayer.tsx`
- `handleVolumeChange` (line 129-133): slider değerini 100'e böl → `setVolumeLevel(vol / 100)`
- `handleMute` (line 136-143): restore volume'u `0.5` yerine `volume || 0.5` olarak normalize et (zaten 0-1 olacak)
- Volume slider'ın `value` prop'unu `[volume * 100]` olarak güncelle (state artık 0-1)

### 3. Audio Element Cleanup ve Stale Callback Düzeltme
**Dosya:** `src/hooks/useSpotifyAudio.ts`

- `setupAudioElement` callback dependency'sine `handleAudioEnd` ekle — mevcut durumda `handleAudioEnd` stale closure ile yakalanıyor
- Component unmount'ta cleanup ekle: `useEffect(() => () => cleanup(), [])` 
- `play()` fonksiyonunda mevcut audio element varsa önce `pause()` et, sonra yeni src ata — overlapping playback önle

### 4. GuideDetail Player Bölümüne Audio Tema İyileştirmesi
**Dosya:** `src/pages/GuideDetail.tsx`

- Player container'a `audio-card-glow` class ekle
- Player wrapper'a kulaklık ikonu ve "Now Playing" başlığı ekle
- Purchased banner'a waveform dekorasyonu ekle

### 5. Preview Button Audio Doğrulama
**Dosya:** `src/hooks/useInvisibleAudioPlayer.ts`

- `audioRef` initialization'ı `useRef<HTMLAudioElement>(null)` — bu doğru, `play()` içinde lazily create ediliyor
- Error event listener çift ekleniyor (line 101 ve line 169) — birini kaldır, conflict olabilir
- Error handler'da `{ once: true }` kullanılıyor (line 101) ama sonra ayrı bir error listener daha ekleniyor (line 169) — bu ikinci listener fallback denemesi sonrasında da tetiklenir ve yanlış hata gösterebilir

**Düzeltme:** İlk error handler'ı (line 101, fallback logic) ve ikinci error handler'ı (line 169, UI feedback) birleştir — tek bir error handling chain yap

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/pages/GuideDetail.tsx` | QR tab kaldır, tabs'ı 2 kolona düşür, player tema iyileştirmesi |
| `src/hooks/useSpotifyAudio.ts` | Volume normalization, stale callback fix, cleanup |
| `src/components/SpotifyStylePlayer.tsx` | Volume slider 0-100 → 0-1 dönüşümü |
| `src/hooks/useInvisibleAudioPlayer.ts` | Çift error handler birleştir |

### Dokunulmayacaklar
- Payment flow, Supabase queries, auth — sıfır değişiklik
- AudioAccess sayfası player'ı (MultiTabAudioPlayer → NewSectionAudioPlayer) — farklı audio hook, bu volume bug'dan etkilenmiyor
- SEO, routing — aynen kalır

