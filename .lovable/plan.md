

## LiveListenersBadge — Ekolayzer Animasyonu

### Performans

3 adet `2px` genisliginde bar'in `height` animasyonu **sifir** performans etkisi yaratir. Nedenler:
- Barlar cok kucuk (2px x max 12px) — layout recalculation maliyeti yok denecek kadar az
- CSS-only animasyon (JS thread'i mesgul etmez)
- `will-change: height` ile GPU hint verilebilir
- Sayfada en fazla 1-2 badge gorunur (GuideDetail + AudioAccess'te tekil, GuideCard listesinde inline variant)

Karsilastirma: Mevcut `animate-ping` zaten surekli calisan bir CSS animasyonu — ekolayzer bundan daha hafif.

### Degisiklikler

**`src/index.css`** — Yeni keyframe ekle:
```css
@keyframes equalizer-bar {
  0%, 100% { height: 3px; }
  50% { height: 12px; }
}
.live-equalizer-bar {
  width: 2px;
  border-radius: 1px;
  background: hsl(var(--primary));
  animation: equalizer-bar 0.8s ease-in-out infinite;
  will-change: height;
}
```

**`src/components/LiveListenersBadge.tsx`** — Her iki variant icin:
- Yesil dot + ping animasyonu kaldir
- 3 barlik ekolayzer ekle (her bar farkli `animation-delay`: 0ms, 200ms, 400ms)
- Badge renkleri: `bg-primary/5 backdrop-blur-sm border-primary/10 text-primary`
- Inline variant: barlar daha kucuk (max `8px`), `w-[1.5px]`
- Headphones ikonu kalsin

### Kullanim Yerleri (degisiklik gerekmez)
- `GuideDetail.tsx` — badge variant ✓
- `AudioAccess.tsx` — badge variant ✓  
- `GuideCard.tsx` — inline variant ✓

Sadece 2 dosya degisikligi. Sistem kesinlikle kasmaz.

