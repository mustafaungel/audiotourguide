

## GuideCard ve Featured Guides — Premium Audio Tasarim Yenileme

### Sorun 1: Inline LiveListenersBadge cok yer kapliyor

Ekran goruntusunde goruldugu gibi, `border border-primary/10` + `px-2 py-0.5` + `rounded-full` cercevesi kartlarda gereksiz alan kapliyor. Cozum: border'i kaldir, sadece ince text olarak goster — ekolayzer + sayi + "listening" yeterli, cerceve gereksiz.

### Sorun 2: FeaturedGuides farkli tasarim kullaniyor

`FeaturedGuides.tsx` hala eski Card/Carousel yapisi — GuideCard bilesenini kullanmiyor. Tutarsiz gorunum.

### Sorun 3: Featured kartlar icin ozel tasarim

Featured guide'lar icin gercekten ozel bir deneyim onerisi:

### Degisiklikler

**1. `src/components/LiveListenersBadge.tsx` — Inline variant sadele**
- Border ve background kaldir
- Sadece: ekolayzer bars + headphones icon + `{count} listening` text
- `text-[10px] text-muted-foreground font-medium` — cercevesiz, hafif
- Badge variant ayni kalsin (detay sayfalarinda iyi gorunuyor)

**2. `src/components/GuideCard.tsx` — Featured kartlar icin ozel tasarim**
- `isFeatured` true oldugunda tamamen farkli gorunum:
  - Ust band: amber gradient yerine **koyu transparan gradient overlay** gorunumlu buyuk gorsel
  - Gorsel tam genislik, daha yuksek (h-40)
  - Baslik gorselin uzerine beyaz text olarak overlay
  - Alt kisimda: konum, sure, dil bayraklari ve listening bilgisi
  - Altin ince border: `border-amber-500/30`
  - "Featured" rozeti gorselin ustunde
  - Waveform alt dekorasyonu animasyonlu hale gelsin (featured icin)
- Normal kartlar: mevcut yatay layout ayni kalsin, sadece listening border kalkar

**3. `src/components/FeaturedGuides.tsx` — GuideCard kullan**
- Carousel yapisi kalsin ama ic kisim `GuideCard` bilesenine gecsin
- `isFeatured={true}` prop'u ile ozel featured tasarimi aktif olsun
- Gereksiz Card/CardContent/CardHeader import'lari kaldirilsin

### Teknik Ozet

```
3 dosya:
  LiveListenersBadge.tsx — inline variant: border/bg kaldir, sade text
  GuideCard.tsx — isFeatured icin buyuk gorsel + overlay baslik + altin border
  FeaturedGuides.tsx — GuideCard bileseni kullan, carousel koru
```

### Featured Kart Gorsel Yapisi

```text
┌─────────────────────────┐
│  ★ Featured        $4.99│  ← badge'ler gorselin ustunde
│                         │
│    [buyuk gorsel]       │  ← h-40, tam genislik
│                         │
│  ▓▓ Guide Basligi ▓▓   │  ← overlay text, beyaz, bold
└─────────────────────────┘
│ 📍 Location · ⏱ 66 min │
│ 🇹🇷🇬🇧🇷🇺  ‖ 🎧 135 listening │
│ .,|.|.,|.|.,|.|.,|.|.,  │  ← animasyonlu waveform
└─────────────────────────┘
```

