

## Plan: Mobil Audio Player Fonksiyonellik İyileştirmesi

### Mevcut Sorunlar (Mobil)
1. **Kalıcı kontrol yok** — Aşağı kaydırınca play/pause kontrolü görünmez oluyor
2. **Seek slider yok** — Sadece chapter içi ince progress bar var, sürüklenemiyor
3. **Kontroller sıkışık** — Prev/skip/next/speed butonları card header'a sıkıştırılmış, küçük dokunma alanları
4. **Tam ekran player yok** — Spotify/Apple Music gibi expand edilebilir bir görünüm yok
5. **Görsel kimlik eksik** — Albüm görseli, now playing bilgisi player'da yok

### Çözüm: 2 Katmanlı Mobil Player

#### Katman 1: Sticky Mini Player (Ekran Alt)
Bir bölüm çalmaya başlayınca ekranın altına sabitlenir, kaydırırken bile görünür kalır.

```text
┌──────────────────────────────────┐
│ [▶] Chapter 3: Old Town  1:23   │
│ ████████░░░░░░░░░░░░░░░░  ─ ▲   │
└──────────────────────────────────┘
```

- Albüm görseli (küçük), bölüm adı, play/pause, mini progress bar
- Yukarı ok ile tam ekrana genişler
- Safe area padding (iPhone notch/home indicator)

#### Katman 2: Tam Ekran Expanded Player
Mini player'a tıklanınca veya yukarı swipe ile açılır.

```text
┌──────────────────────────────────┐
│  ▼  Collapse          Now Playing│
│                                  │
│        ┌──────────────┐          │
│        │  Album Art   │          │
│        │   200x200    │          │
│        └──────────────┘          │
│                                  │
│  Chapter 3: Old Town Square      │
│  3 of 8 • Prague Walking Tour    │
│                                  │
│  ████████████░░░░░░░░░░░░░░░░░  │
│  1:23              4:56          │
│                                  │
│    ⏪-15   ⏮  [ ▶ ]  ⏭  ⏩+15   │
│                                  │
│         🔀   🔁   1.0×           │
└──────────────────────────────────┘
```

- Büyük albüm görseli, dominant renk arka plan
- Draggable seek slider
- Büyük kontrol butonları (min 48px touch target)
- Shuffle, repeat, speed kontrolleri
- Swipe down ile mini player'a küçülme

### Teknik Değişiklikler

**Dosya: `src/components/NewSectionAudioPlayer.tsx`**
- Mobilde `currentSectionIndex >= 0` (bir şey çalıyorken) sticky mini player render et
- Mini player'a tıklanınca `isExpanded` state ile tam ekran aç
- Tam ekran player: albüm görseli (prop olarak alınacak), seek slider, büyük kontroller
- `position: fixed; bottom: 0` ile yapışık kalması
- `guideImageUrl` prop'u ekle (AudioAccess'ten geçirilecek)

**Dosya: `src/components/ChapterList.tsx`**
- Header'daki kontrolleri sadeleştir (mini player'a taşındığı için)
- Mobilde header kontrollerini gizle (mini player zaten gösteriyor)

**Dosya: `src/pages/AudioAccess.tsx`**
- `MultiTabAudioPlayer`'a `guideImageUrl` prop'u geçir
- Sticky player nedeniyle sayfa altına padding ekle (`pb-[120px]`)

**Dosya: `src/components/MultiTabAudioPlayer.tsx`**
- `guideImageUrl` prop'unu `NewSectionAudioPlayer`'a ilet

### Dokunulmayacaklar
- SpotifyStylePlayer (GuideDetail sayfasında kullanılıyor, ayrı akış)
- Audio playback logic (useSpotifyAudio, audio element management)
- BottomSheet mekanizması — linked guide drawer'lar aynen kalır
- Payment, auth, Supabase queries — sıfır değişiklik

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/NewSectionAudioPlayer.tsx` | Sticky mini player + tam ekran expanded player ekleme |
| `src/components/ChapterList.tsx` | Mobilde header kontrollerini sadeleştirme |
| `src/pages/AudioAccess.tsx` | Image prop geçirme, bottom padding |
| `src/components/MultiTabAudioPlayer.tsx` | Image prop iletme |

