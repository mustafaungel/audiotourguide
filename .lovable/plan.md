

## Plan: AudioAccess Performans İyileştirme + MiniPlayer Büyütme

### Tespit Edilen Sorunlar

1. **MiniPlayer `backdrop-blur-2xl`**: MiniPlayer.tsx satır 70'te hâlâ `backdrop-blur-2xl` var — mobilde her frame'de tüm altındaki pikselleri yeniden işliyor, kasma kaynağı.

2. **MiniPlayer çok küçük**: Thumbnail `w-10 h-10`, play butonu `w-10 h-10`, skip butonları `w-8 h-8` — mobilde küçük kalıyor.

3. **Accordion animasyonları kasma**: `animate-accordion-down/up` keyframe'leri `height` animasyonu yapıyor — layout recalculation tetikliyor, GPU yerine CPU'da çalışıyor.

4. **ChapterList card'larında `shadow-lg`**: Aktif chapter'da `shadow-lg shadow-primary/20` var — her frame'de repaint.

5. **Badge'deki `backdrop-blur-md`**: Hero bölümündeki kategori badge'inde `backdrop-blur-md` var (AudioAccess.tsx satır 717).

### Çözümler

**`src/components/MiniPlayer.tsx`:**
- `backdrop-blur-2xl bg-background/90` → `bg-background border-t border-border/40` (opak, blur yok)
- Thumbnail: `w-10 h-10` → `w-12 h-12`
- Play butonu: `w-10 h-10` → `w-12 h-12`, ikon boyutu büyüt
- Skip butonları: `w-8 h-8` → `w-10 h-10`, ikon `w-3.5 h-3.5` → `w-4 h-4`
- Speed butonu: `h-7` → `h-8`, font biraz büyüt
- Padding: `px-3 py-2` → `px-4 py-3`
- Genel olarak daha rahat, daha dokunulabilir bir layout

**`src/components/MultiTabAudioPlayer.tsx`:**
- Accordion açılış/kapanış animasyonlarını `height` tabanlı keyframe'lerden `max-height` + `opacity` + `transform` geçişine çevir
- Açılış: `max-height: 0 → 600px`, `opacity: 0 → 1`, `translateY(-8px) → 0`
- Kapanış: tersi — CSS transition ile, keyframe değil
- `closingGuideId` mantığı korunur, `onTransitionEnd` ile temizlenir

**`src/pages/AudioAccess.tsx`:**
- Badge satır 717: `backdrop-blur-md` → kaldır, `bg-background/80` yeterli

**`src/components/ChapterList.tsx`:**
- Aktif chapter: `shadow-lg shadow-primary/20` → `shadow-sm` veya kaldır (border yeterli)

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MiniPlayer.tsx` | backdrop-blur kaldır, tüm elementleri büyüt |
| `src/components/MultiTabAudioPlayer.tsx` | Accordion animasyonunu GPU-friendly geçişe çevir |
| `src/pages/AudioAccess.tsx` | Badge backdrop-blur kaldır |
| `src/components/ChapterList.tsx` | Aktif chapter shadow hafiflet |

