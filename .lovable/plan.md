

## Plan: Audio Playback Latency Fix + Offline Playback Korunması

### Sorun
`NewSectionAudioPlayer.tsx` her bölümü çalmadan önce **tüm MP3'ü blob olarak indiriyor** (`resolveBlobUrl` → HEAD + full fetch). Bu mobilde 1-3 saniye gecikme yaratıyor.

### Kritik Kısıt: Offline Playback
Kullanıcı online iken access sayfasına girdiyse, sonradan internet kesilse bile sesler çalmaya devam etmeli. Mevcut blob-cache mantığı offline'a yardım ediyor (5MB altı dosyalar bellekte tutuluyor) — **bu davranışı kaybetmemeliyiz**.

### Çözüm: Hibrit Yaklaşım

**İlk oynatma → Streaming (hızlı başlangıç)**
**Arka plan → Blob cache (offline garanti)**

#### Değişiklik 1: `playSection` — Stream-First
- `await resolveBlobUrl(...)` çağrısını **kaldır**
- Pre-resolved raw URL'i (`resolvedUrlsRef.current[sectionIndex]`) **senkron** olarak `audio.src`'ye ata
- `audio.play()` user gesture içinde anında çağrılır
- **Kazanç**: ~1-3 saniye → ~200ms başlangıç

#### Değişiklik 2: Arka Plan Blob Cache (Offline için)
- `playSection` çağrıldıktan sonra, **fire-and-forget** şekilde:
  - `resolveBlobUrl(currentIndex)` arkada çalışsın
  - 5MB altı dosya blob olarak `blobUrlCache`'e kaydedilsin
  - **Çalan ses kesintiye uğramaz** (sadece cache doldurulur)
- Bir sonraki oynatmada (veya offline durumda) cache'den blob URL kullanılır

#### Değişiklik 3: Smart Preload — Sıradaki Bölüm
- Mevcut `useAudioPreload.ts` hook'unu entegre et
- Çalan bölüm bittiğinde **bir sonraki bölüm** zaten browser cache'inde
- Auto-advance'te sıfır gecikme

#### Değişiklik 4: Loading State İyileştirme
- `canplay` event'inde `loading=false` (mevcut: `play().then` sonrası)
- Daha hassas yükleme göstergesi

### Offline Akış Garantisi

```
Online + Access sayfasına gir:
  → Bölüm 1 oynat: stream + arka planda blob cache'e ekle
  → Bölüm 2 preload (browser HTTP cache)
  → Kullanıcı bölümleri dinledikçe cache dolar

Internet kesildi:
  → Cache'lenmiş bölümler: blob URL'den çalar ✅
  → Browser HTTP cache'indeki bölümler: çalar ✅
  → Hiç açılmamış bölümler: çalmaz (mevcut davranışla aynı)
```

**Not**: Mevcut sistem zaten offline-first değil — sadece blob cache'lenen dosyalar offline çalışır. Yeni sistem **aynı offline kapasitesini korur** ama ilk oynatma çok daha hızlı olur.

### Etkilenen Dosyalar
- `src/components/NewSectionAudioPlayer.tsx` — `playSection`, event listener'lar
- `src/hooks/useAudioPreload.ts` — entegrasyon

### DOKUNULMAYACAKLAR
- ✅ `useAudioPlayer`, `useInvisibleAudioPlayer`, `LibraryAudioPlayer`
- ✅ MediaSession API, mobile gesture chain
- ✅ Dil değiştirme mantığı, linked guides
- ✅ Mini/Expanded player UI
- ✅ Blob cache mekanizması (sadece async hale geliyor)

### Doğrulama Adımları
1. Online: bölüm tıkla → <500ms başlasın
2. Online: bölümü dinle, internet kes → bölüm çalmaya devam etsin
3. Offline: aynı bölümü tekrar başlat → blob cache'den çalsın
4. Auto-advance: kesintisiz geçiş
5. Dil değiştir → mevcut davranış korunsun

