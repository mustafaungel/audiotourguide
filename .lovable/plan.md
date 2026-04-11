

## Konum Badge Görselin Üstüne + Listening Now Aynı Hizada

### Yeni Layout

```text
┌──────────────────────────────────┐
│ 📍 Cappadocia, Turkey            │  ← Konum badge görselin üstünde
│ [Görsel 128x128] [🇺🇸🇫🇷🇳🇱🇨🇳]   │  ← Görsel + dil emojileri yan yana
│                  [🇪🇸🇮🇹🇯🇵]      │
│ 🎧 112 listening now             │  ← Görselin altında, aynı hizada
└──────────────────────────────────┘
```

Süre ve stops satırı kaldırılacak.

### Değişiklik — `src/pages/GuideDetail.tsx` (satır 710-723)

Mevcut bottom bölümünü yeniden düzenle:

1. **Konum badge'i** görselin üstüne taşınacak (satır 684'ün öncesine)
2. **Süre/stops satırı** (satır 717-722) silinecek
3. **LiveListenersBadge** görselin altında kalacak

```tsx
<div className="space-y-3">
  {/* Konum badge — görselin üstünde */}
  <span className="inline-flex items-center gap-1.5 w-fit bg-primary/10 text-primary text-xs font-medium rounded-full px-2.5 py-1">
    <MapPin className="w-3 h-3" />
    {guide.location}
  </span>

  {/* Görsel + Dil emojileri yan yana */}
  <div className="flex gap-4">
    <div className="relative w-32 h-32 ...">
      <OptimizedImage ... />
      <Badge ...>{guide.category}</Badge>
    </div>
    <div className="flex-1 min-w-0 flex items-start">
      <GuideLanguageSelector ... />
    </div>
  </div>

  {/* Listening now — görselin altında */}
  <LiveListenersBadge guideId={guide.id} />
</div>
```

Tek dosya, tek bölüm. Süre/stops kaldırıldı, konum yukarı taşındı.

