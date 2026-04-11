

## "now" Kaldırma + Listening Badge Görselle Aynı Hizada

### Değişiklikler

**1. `src/components/LiveListenersBadge.tsx` (satır 35)**
- `listening now` → `listening` olarak değiştirilecek. Tüm kullanım yerlerinde otomatik güncellenmiş olacak (GuideDetail, Access, kartlar vs.)

**2. `src/pages/GuideDetail.tsx` (satır 714-717)**
- `LiveListenersBadge` görselin altından kaldırılıp, görsel+dil emojileri satırının içine taşınacak — görselle aynı hizada olacak.

Yeni layout:
```text
┌──────────────────────────────────┐
│ [Görsel 128x128] [🇺🇸🇫🇷🇳🇱🇨🇳]   │
│  📍 pin  konum   [🇪🇸🇮🇹🇯🇵]      │
│                  🎧 42 listening │  ← Dil emojilerinin altında, aynı hizada
└──────────────────────────────────┘
```

`LiveListenersBadge` dil seçicinin bulunduğu `flex-1` div'in içine, `GuideLanguageSelector`'ın altına taşınacak.

2 dosya, küçük değişiklikler.

