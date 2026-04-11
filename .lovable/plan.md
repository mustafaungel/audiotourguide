

## Guide Kartlarından Equalizer Animasyonunu Kaldır

### Problem
Compact (kart) boyutundaki badge'de equalizer animasyonu gereksiz görsel karmaşa yaratıyor.

### Çözüm
`MiniEqualizer` bileşenini sadece `default` boyutta göster, `compact` boyutta render etme.

### Teknik
**`src/components/LiveListenersBadge.tsx` (satır 34)**

```tsx
// Önce:
<MiniEqualizer small={isCompact} />

// Sonra:
{!isCompact && <MiniEqualizer />}
```

Tek satır değişikliği — compact modda equalizer barları render edilmeyecek, sadece kulaklık ikonu + sayı + "listening now" metni kalacak.

