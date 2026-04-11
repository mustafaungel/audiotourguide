

## LiveListenersBadge — Premium Tasarim Iyilestirmesi

### Sorunlar

1. **Badge cok basit** — duz yazi + ikon, premium audio guide temasina yakismayan minimal gorunum
2. **Kart icindeki inline variant** — badge hissi vermiyor, sadece duz text
3. **Ekolayzer hala biraz hizli** — 1.6s → 2.2s'e dusurulmeli

### Degisiklikler

**1. `src/index.css` — Animasyon yavaslatma**
- `1.6s` → `2.2s` (her iki class icin)

**2. `src/components/LiveListenersBadge.tsx` — Premium badge tasarimi**

Badge variant (GuideDetail, AudioAccess):
- Cam efekti guclendir: `bg-card/60 backdrop-blur-xl saturate-150`
- Gradient border efekti: dis wrapper ile `bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20` + ic `p-[1px] rounded-full`
- Ince shadow: `shadow-[0_2px_12px_hsl(var(--primary)/0.12)]`
- Sayi bold yapilsin, "listening now" normal weight
- Ekolayzer + kulaklık + `{count}` **listening now** formati

Inline variant (GuideCard icinde):
- Mini pill badge formuna cevir: `bg-primary/8 rounded-full px-2 py-0.5 border border-primary/10`
- Ekolayzer + `{count} listening` tek satirda
- Kulaklık ikonu kalsin

**3. `src/components/GuideCard.tsx` — Inline badge konumu**
- Mevcut konum uygun, sadece LiveListenersBadge'in yeni pill stili yeterli

### Teknik Ozet

```
3 dosya: index.css, LiveListenersBadge.tsx, GuideCard.tsx (konum degisiklik yok)

CSS: animation duration 1.6s → 2.2s
Badge: gradient border + glass + shadow
Inline: mini pill badge + border
```

