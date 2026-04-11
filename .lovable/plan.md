

## LiveListenersBadge'i Görselin Altına Taşıma

### Problem
Şu an `LiveListenersBadge` görselin sağ tarafındaki dil seçici alanının içinde (satır 713). Kullanıcı görselin hemen altında olmasını istiyor.

### Çözüm — `src/pages/GuideDetail.tsx`

**Satır 713:** `LiveListenersBadge`'i `flex-1` div'den kaldır.

**Satır 715-716 arası:** `flex gap-4` div'in kapandığı yerin hemen altına, `space-y-3` div'in içine taşı.

```text
┌──────────────────────────────────┐
│ [Görsel 128x128] [🇺🇸🇫🇷🇳🇱🇨🇳]   │
│  📍 pin  konum   [🇪🇸🇮🇹🇯🇵]      │
│                  [🇵🇹]           │
├──────────────────────────────────┤
│ 🎧 42 listening                 │  ← Görselin hemen altında, ayrı satır
└──────────────────────────────────┘
```

Tek dosya, 2 satır değişikliği: satır 713'ten sil, satır 715'in altına ekle.

