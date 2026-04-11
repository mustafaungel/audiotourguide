

## "Featured" Yazisi Kaldirma + Listening Gostergesi Iyilestirme

### 1. "Featured" yazilari kaldir (3 yer)

**`src/components/GuideCard.tsx`** (satir 82-87):
- `★ Featured` badge'i tamamen kaldirilir. Amber renk zaten featured oldugunu belirtiyor.

**`src/pages/GuideDetail.tsx`** (2 yer):
- Satir 737-741: Sticky header'daki `★ Featured` badge kaldirilir
- Satir 773-778: Gorsel altindaki `★ Featured` badge kaldirilir

### 2. Inline listening gostergesi — canli his

**`src/components/LiveListenersBadge.tsx`** inline variant:

Mevcut duz `🎧 135 listening` yerine daha canli bir tasarim:

- Kulaklik ikonuna **pulse animasyonu** ekle: `animate-pulse` ile hafif titresim efekti (canli yayinda gibi)
- Sayi **tabular-nums font** ile monospace gorunum (`font-mono tabular-nums`)
- "listening" kelimesini italik yap (`italic`)
- Renk: `text-muted-foreground` → `text-primary/70` (biraz daha belirgin)
- Sonuc: `🎧~ 135 listening` — kulaklık titriyor, sayi monospace, "listening" italic

```text
Onceki:  🎧 135 listening     (duz, silik, sade text)
Sonraki: 🎧~ 135 listening    (pulse ikon, mono sayi, italic yazi, daha belirgin renk)
```

### Teknik Ozet

```
3 dosya:
  GuideCard.tsx — Featured badge kaldir (satir 82-87)
  GuideDetail.tsx — 2x Featured badge kaldir (satir 737-741, 773-778)
  LiveListenersBadge.tsx — inline: pulse headphones + mono sayi + italic listening + text-primary/70
```

