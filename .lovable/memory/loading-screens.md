# Memory: Loading Screens Design Decision

## Rule
Tüm yükleme ekranları audio guide temalı olmalıdır. Generic spinner veya düz gri skeleton kullanılmamalıdır.

## Bileşen
`src/components/AudioGuideLoader.tsx` — Tek merkezi loader bileşeni

## Varyantlar
- `variant="page"` — Tam sayfa: kulaklık ikonu + ses dalgası + mesaj
- `variant="card"` — Skeleton kartlar: kulaklık ikonu + ses dalgası çubukları
- `variant="grid"` — Ülke grid: yuvarlak placeholder + kulaklık ikonu
- `variant="initial"` — App ilk yükleme: minimal kulaklık + ses dalgası

## Mesaj Sistemi
- İlk yükleme: "Tuning in..."
- Guide detay: "Preparing your audio experience..."
- Erişim doğrulama: "Unlocking your audio tour..."
- Ödeme doğrulama: "Confirming your purchase..."
- Liste yükleme: "Discovering audio guides..."

## CSS
- `audio-wave-bar` class'ı ile ses dalgası animasyonu
- `audio-icon-pulse` ile kulaklık ikonu pulse efekti
- `audio-message-fade` ile mesaj fade-in
- Keyframes: `audio-wave`, `icon-pulse`, `message-fade` (src/index.css)
- index.html'de inline CSS versiyonu (React öncesi)

## Kullanım
```tsx
import { AudioGuideLoader } from '@/components/AudioGuideLoader';
<AudioGuideLoader variant="page" message="Preparing your audio experience..." />
<AudioGuideLoader variant="card" count={6} />
```
