

## Plan: Drawer Sadece X ile Kapansın + Hız Kontrolü

### Mevcut Durum
`bottom-sheet.tsx` dosyasında drawer 3 farklı yolla kapanabiliyor:
1. **Backdrop tıklama** (satır 176) — `onClick={() => onOpenChange(false)}`
2. **Aşağı sürükleme** (satır 136-147) — velocity veya mesafe eşiği aşılınca `onOpenChange(false)`
3. **X butonu** (satır 216) — doğru çalışıyor

### Yapılacaklar

#### 1. Backdrop tıklamasını devre dışı bırak
- Satır 176'daki `onClick={() => onOpenChange(false)}` kaldırılacak
- Backdrop yine görünecek ama tıklama drawer'ı kapatmayacak

#### 2. Sürükleme ile kapanmayı devre dışı bırak
- `handleTouchEnd` içindeki `onOpenChange(false)` çağrıları kaldırılacak (satır 138 ve 147)
- Sürükleme hala snap noktaları arasında geçiş yapabilir (half↔full) ama drawer'ı tamamen kapatamaz
- En alt snap noktasına (mini) sürüklenirse orada kalır, kapanmaz

#### 3. Animasyon hızı kontrolü
- Mevcut `0.4s cubic-bezier(0.25, 1, 0.5, 1)` iyi bir easing — korunacak
- Backdrop fade `0.35s ease` — uyumlu, korunacak

### Etkilenen Dosya
- `src/components/ui/bottom-sheet.tsx` — 3 satır değişiklik

