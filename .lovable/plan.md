
## Plan: Audio Guide Temalı Kart Tasarım Yenileme

### Problem
1. Metadata satırında dakika bilgisi sığmıyor, sıkışma yapıyor
2. Sabit yükseklikler (`h-[2.75rem]`) kırılgan — font/ekran boyutuna göre içerik taşıyor veya boşluk kalıyor
3. Kartlar generic görünüyor, audio guide teması yansımıyor

### Yeni Tasarım Konsepti

Spotify/Apple Podcasts tarzı, ses dalgası ve kulaklık temalı kart:

```text
┌─────────────────────────────┐
│  [Görsel - aspect-[4/3]]    │
│  ┌────────┐    ┌──┐ ┌──┐   │
│  │cultural│    │🔖│ │↗️│   │
│  └────────┘    └──┘ └──┘   │
│         ▶ (hover play)      │
│  ░░▓▓░▓▓▓░░▓░░ (waveform)  │
├─────────────────────────────┤
│  🎧 Title (max 2 lines)    │
│                             │
│  Description (2 lines)      │
│                             │
│  📍 Location · ⏱ 45 min    │
│                             │
│  ┌─────────────────────┐    │
│  │  $4.99  ▶ Listen Now│    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### Değişiklikler

#### 1. `src/components/GuideCard.tsx` — Tam yeniden yapılandırma

**Görsel bölümü:**
- Görselin altına CSS ses dalgası barları ekle (3-4 bar, `audio-waveform` rengiyle)
- Görsel overlay'ini gradient-overlay ile zenginleştir

**İçerik bölümü — sabit yükseklik yerine flexbox çözümü:**
- Tüm sabit `h-[...]` değerlerini kaldır
- `flex-1 flex flex-col justify-between` ile kartın iç alanını otomatik dağıt
- Başlık: `line-clamp-2` (sabit h yok, flex tarafından kontrol edilir)
- Açıklama: `line-clamp-2` (sabit h yok)
- Metadata: tek satır, font küçült (`text-xs`), ortadaki nokta (·) ile ayır — artık 3 ayrı flex item yerine tek satır metin

**Metadata satırı düzeltme:**
- `MapPin + Location · Clock + 45 min` formatı — tek satırda sığar
- `truncate` ile location taşarsa kesilir
- `totalPurchases` bilgisini bu satırdan tamamen kaldır (zaten çoğu kartta yok, eşitsizlik yaratıyordu)

**Alt bölüm — fiyat + buton birleşik:**
- Fiyat ve buton aynı satırda: solda fiyat, sağda "Listen Now" butonu
- Buton daha kompakt, kulaklık ikonu ile

**Kulaklık ikonu:**
- Başlığın yanına küçük kulaklık ikonu (🎧) ekle — audio guide kimliği

#### 2. `src/index.css` — Ses dalgası dekoratif barlar

- `.card-waveform` class'ı: görselin alt kenarında 4 küçük animasyonlu bar
- Hover'da barlar hareket eder (mevcut `audio-wave` keyframe'ini kullanır)
- Barlar `audio-waveform` renginde, yarı saydam

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/GuideCard.tsx` | Kart layout yeniden yapılandırma, metadata düzeltme, audio teması |
| `src/index.css` | `.card-waveform` dekoratif animasyon class'ı |

### Sonuç
- Tüm kartlar **doğal olarak** aynı yükseklikte olacak (flex justify-between sayesinde)
- Dakika sıkışması çözülecek (tek satır, `text-xs`, nokta ayracı)
- Audio guide teması görsel olarak yansıyacak (ses dalgası barları, kulaklık ikonu)
- Daha kompakt ve modern görünüm
