

## LiveListenersBadge Iyilestirme Plani

### Sorunlar

1. **Ekolayzer cok hizli** — `0.8s` surede donguyu tamamliyor, stresli gorunuyor
2. **Kulaklik ikonu kartlarda gorunmuyor** — inline variant'ta `Headphones` ikonu yok
3. **"listening" yazisi cok silik** — `text-primary/70` opacity cok dusuk, okunmuyor
4. **GuideDetail ve AudioAccess'te duzensiz** — badge variant kullaniliyor ama sayfa icinde konumlandirma tutarsiz

### Degisiklikler

**1. `src/index.css` — Animasyon yavaslatma**
- `0.8s` → `1.6s` (iki kat yavas, rahatlatici hareket)
- Hem `.live-equalizer-bar` hem `.live-equalizer-bar-sm` icin

**2. `src/components/LiveListenersBadge.tsx` — Her iki variant iyilestirme**

Inline variant (GuideCard icinde):
- `Headphones` ikonu ekle (w-2.5 h-2.5)
- Text opacity `text-primary/70` → `text-primary` (tam gorunur)
- Font weight `font-medium` ekle

Badge variant (GuideDetail, AudioAccess):
- Zaten iyi, sadece font weight ve text renk tutarliligi

**3. `src/pages/GuideDetail.tsx` — Badge konumlandirma**
- LiveListenersBadge'i baslik altinda duzgun hizalanmis badge olarak goster
- `mt-1` ile basliktan ayir

**4. `src/pages/AudioAccess.tsx` — Badge konumlandirma**
- Mevcut `flex justify-center` wrapper'i zaten var — tutarli

### Teknik Detay

```
CSS degisikligi:
  animation: equalizer-bar 0.8s → 1.6s (her iki class)

Inline variant:
  <Headphones w-2.5 h-2.5 /> eklenir
  text-primary/70 → text-primary
  font-medium eklenir

4 dosya: index.css, LiveListenersBadge.tsx, GuideDetail.tsx, AudioAccess.tsx
```

