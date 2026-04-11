

## 3 Düzeltme: Ekolayzer Hızı + Başlık Taşması + Metin Derinliği

### 1. Ekolayzer Animasyon Hızı Senkronizasyonu

**Problem:** GuideCard waveform barları `equalizer-bar 2.2s` animasyonu kullanırken, Load More butonundaki barlar `audio-wave 1s` animasyonu kullanıyor — farklı hız ve keyframe.

**Çözüm:** Load More butonundaki `audio-wave-bar` class'ını kaldırıp, GuideCard ile aynı `equalizer-bar` animasyonunu inline style olarak ver (2.2s, aynı keyframe).

| Dosya | Değişiklik |
|-------|-----------|
| `Index.tsx` | Load More barlarında `audio-wave-bar` → inline `animation: equalizer-bar 2.2s ease-in-out infinite` |
| `Guides.tsx` | Aynı değişiklik |

### 2. Üst Band Başlık Taşması

**Problem:** `uppercase tracking-wide` ile uzun başlıklar sığmıyor (ekran görüntüsünde "CAPPADOCIA : DISCOVER HIDDEN V..." kesiliyor).

**Çözüm:**
- `text-[13px]` → `text-[12px]` küçültme
- `tracking-wide` → `tracking-normal` harfler arası boşluğu azalt
- `truncate` zaten var, düzgün kesilecek

| Dosya | Değişiklik |
|-------|-----------|
| `GuideCard.tsx` | Üst band title: `text-[12px] tracking-normal` |

### 3. Metin Derinliği — Text Shadow + Kontrast

**Problem:** Kartlardaki metinler hala düz ve silik. Gölgelendirme yok, derinlik hissi yok.

**Çözüm:**
- `index.css`'e `.card-text-primary` ve `.card-text-secondary` utility class'ları ekle (text-shadow ile)
- GuideCard'da lokasyon ve süre metinlerine bu class'ları uygula
- Üst band başlığa `drop-shadow-sm` ekle
- Lokasyon font boyutunu `text-xs` → `text-sm` yükselt, daha belirgin olsun

| Dosya | Değişiklik |
|-------|-----------|
| `index.css` | `.card-text-primary { text-shadow: 0 1px 3px hsl(0 0% 0% / 0.12) }` ve `.card-text-secondary { text-shadow: 0 1px 2px hsl(0 0% 0% / 0.06) }` ekle. Dark mode'da opaklık artır. |
| `GuideCard.tsx` | Lokasyon: `text-sm font-semibold card-text-primary`, Süre: `text-xs font-semibold card-text-secondary`, Band başlık: `drop-shadow-sm` ekle |

### Teknik Özet

```
3 dosya:

src/index.css
  - .card-text-primary ve .card-text-secondary utility class (text-shadow)
  - Dark mode varyantları

src/components/GuideCard.tsx
  - Band title: text-[12px] tracking-normal + drop-shadow-sm
  - Lokasyon: text-sm font-semibold + card-text-primary
  - Süre: text-xs font-semibold + card-text-secondary
  - Waveform animasyonu: değişiklik yok (zaten 2.2s equalizer-bar)

src/pages/Index.tsx
  - Load More barları: audio-wave-bar class yerine inline style equalizer-bar 2.2s

src/pages/Guides.tsx
  - Aynı Load More bar düzeltmesi
```

