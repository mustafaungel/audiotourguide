

## Plan: ExpandedPlayer Açıkken MiniPlayer'ı DOM'da Bırak

### Kullanıcının Önerisi — Değerlendirme
> "Expanded player açılınca mini player kaybolmamalı"

**Cevap: Mantıklı ve güvenli — hiçbir şey bozulmaz.** Detay aşağıda.

### Mevcut Davranış
`NewSectionAudioPlayer.tsx` satır 427:
```tsx
const miniPlayerElement = isMobile && isActive && !isExpanded ? createPortal(<MiniPlayer .../>) : null;
```
ExpandedPlayer açıldığında MiniPlayer **unmount** ediliyor → kapatınca yeniden mount.

### Önerilen Değişiklik
Tek satırlık koşul güncellemesi: `!isExpanded` kontrolünü kaldır.
```tsx
const miniPlayerElement = isMobile && isActive ? createPortal(<MiniPlayer .../>) : null;
```

### Neden Hiçbir Şey Bozulmaz
| Endişe | Gerçek Durum |
|---|---|
| Görsel çakışma | ExpandedPlayer `z-[70]` + opaque `bg-background` → MiniPlayer (`z-50`) tamamen örtülür, kullanıcı görmez ✅ |
| Çift ses | Tek `audioRef` paylaşılıyor, iki UI ortak state'i okuyor → sadece bir ses akışı ✅ |
| Tıklama çakışması | ExpandedPlayer üstte olduğu için MiniPlayer'ın `onClick` (expand) tetiklenemez ✅ |
| Performans | MiniPlayer zaten `React.memo`. State değişince zaten render oluyor — fazladan maliyet yok ✅ |
| MediaSession / kilit ekranı | Bu API audio element'e bağlı, UI'dan bağımsız → etkilenmez ✅ |
| Drag-to-close animasyonu | ExpandedPlayer kendi transform'unu yönetiyor, MiniPlayer pasif arka planda → çakışma yok ✅ |

### Bonus Kazanç
- Kapatma anında **MiniPlayer mount maliyeti yok** → daha akıcı kapanış animasyonu.
- Marquee text ve progress bar state'leri korunur (yeniden başlamaz).

### Etkilenen Dosya
- `src/components/NewSectionAudioPlayer.tsx` — 1 satır (satır 427'de `&& !isExpanded` ifadesini kaldır)

### Doğrulama
1. Bölüm çal → MiniPlayer görünür
2. Yukarı kaydır → ExpandedPlayer açılır, MiniPlayer görsel olarak görünmez (arkada)
3. ExpandedPlayer'ı kapat → MiniPlayer anında "yeniden belirme" gecikmesi olmadan ortaya çıkar
4. Auto-advance, dil değiştirme, skip, speed → değişmez

### Risk: Sıfır
Bu sadece bir koşul gevşetmesi; mevcut z-index katmanı zaten görsel doğruluğu garantiliyor.

