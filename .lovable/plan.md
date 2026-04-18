

## Sorun: 30s Preview Çalışmıyor — Yanlış Storage URL

### Root Cause (Doğrulandı)

Konsol logu: `Using audio URL: .../guide-audio/uploaded-1776273161075-...mp3`
HEAD test sonucu: **HTTP 400** (dosya yok)

Diğer URL şablonu: `.../guide-audio/{guideId}.mp3`
HEAD test sonucu: **HTTP 200, audio/mpeg, 4.7MB** ✅

`useInvisibleAudioPlayer.ts` (satır 13): `chapterAudioSrc = chapter.audio_url || guide?.audio_url` — bu DB'deki `audio_url` kolonunu kullanıyor ve içinde **eski/yanlış** path var (`uploaded-{timestamp}-{uuid}.mp3` formatı). Storage'da gerçek dosya `{guideId}.mp3` formatında duruyor.

Fallback de başarısız oluyor çünkü `/tmp/{guideId}.mp3` (lokal public path) bu rehber için mevcut değil.

### Çözüm — `useInvisibleAudioPlayer.ts` (Tek Dosya, ~15 Satır)

`handleError` içindeki fallback mantığını **3 katmanlı** yapacağım:

```
1. denenen URL: audioSrc (DB'deki audio_url) → 400 alırsa
2. fallback A: Supabase storage `{guideId}.mp3` → bulamazsa
3. fallback B: /tmp/{guideId}.mp3 (mevcut davranış)
```

**Mevcut davranış**: Supabase URL → `/tmp/` (atlanan adım: storage'daki doğru `{guideId}.mp3`)
**Yeni davranış**: Yanlış URL → storage `{guideId}.mp3` → `/tmp/`

### Değişiklik Detayı

`useInvisibleAudioPlayer.ts` içinde:
- `fallbackAttempted.current` (boolean) → `fallbackStep` (number: 0/1/2)
- `handleError`:
  - Step 0 → storage'dan `{guideId}.mp3` URL üret, dene (step=1)
  - Step 1 → `/tmp/{guideId}.mp3` dene (step=2)
  - Step 2 → toast hata göster

### Garanti — Audio Sistemi Bozulmaz

- ✅ Sadece `useInvisibleAudioPlayer` (preview butonu) etkilenir
- ✅ `useAudioPlayer`, `NewSectionAudioPlayer`, `MiniPlayer`, `ExpandedPlayer`, `LibraryAudioPlayer` — **DOKUNULMUYOR**
- ✅ MediaSession, mobile gesture, language switch logic — **DOKUNULMUYOR**
- ✅ Satın alma sonrası tam-uzunluk oynatma — bu hook'u kullanmıyor, etkilenmez
- ✅ User gesture chain korunur (URL üretimi sync, sadece `audio.load()` async)

### Etkilenen Dosya
- `src/hooks/useInvisibleAudioPlayer.ts` (~15 satır değişim)

### Doğrulama
1. Build kontrolü
2. Browser'da bir guide detay sayfasında 30s preview butonuna basılır → ses oynar
3. Konsol: "Trying storage fallback: .../{guideId}.mp3" → 200 → çalar

### Notu
Bu, **veri sorununu** (DB'de yanlış `audio_url` değerleri) maskeleyen bir UX-koruma katmanıdır. İsterseniz ayrı bir görev olarak DB'deki yanlış `audio_url` değerlerini de düzeltme planı sunabilirim — ama bu yeni planın konusu değil.

