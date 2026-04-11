

## GuideCard Başlık Bandı ve Kenar Güncellemesi

### Yapılacaklar

**`src/components/GuideCard.tsx`**

1. **Kulaklık ikonunu kaldır** — Satır 81'deki `<Headphones>` bileşeni silinecek.

2. **Kart kenar renklerini başlık bandıyla uyumlu ve daha belirgin yap:**
   - Featured: `border-amber-500/30` → `border-amber-500/50`
   - Normal: `border-border/50` → `border-primary/30`

3. **Hover durumunda kenar rengi de temaya uyumlu olacak:**
   - Featured: `hover:border-amber-500/40`
   - Normal: `hover:border-primary/30` (mevcut `hover:border-primary/20` → `/30`)

### Tek dosya değişikliği
- `src/components/GuideCard.tsx` — 3 satır düzenleme

