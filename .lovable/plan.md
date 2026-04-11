

## GuideDetail Sticky Header Okunabilirlik + Geri Butonu Büyütme + Non-Featured Tema

### 1. Sticky Header Okunabilirliği (GuideDetail + AudioAccess)

**Problem:** Başlık `text-xs` ve `font-bold` — küçük ekranlarda zor okunuyor.

**Çözüm:**
- Başlık font boyutunu `text-xs` → `text-sm` yap
- Headphones ikonunu `w-3.5 h-3.5` → `w-4 h-4` yap
- Padding'i `py-2` → `py-2.5` yap (biraz daha nefes alsın)

### 2. Geri Butonu Büyütme (Tüm Sayfalar)

**Mevcut:** `w-10 h-10`, ikon `w-5 h-5`

**Yeni:** `w-11 h-11`, ikon `w-5.5 h-5.5` (veya `w-[22px] h-[22px]`)

Etkilenen yerler:
- `src/pages/GuideDetail.tsx` — satır 667
- `src/pages/AudioAccess.tsx` — satır 704

### 3. Non-Featured Guide'lar İçin Özel Tema

Featured guide'larda amber/altın tonları kullanılıyor. Non-featured guide'lar şu an generic `bg-background/70`, `bg-primary/15`, `border-border/30` kullanıyor — özel bir hissi yok.

**Çözüm:** Non-featured guide'lara primary renk temasını daha belirgin uygula:

| Eleman | Mevcut (non-featured) | Yeni (non-featured) |
|--------|----------------------|---------------------|
| Sticky header bg | `bg-background/70` | `bg-primary/5 dark:bg-primary/10` |
| Sticky header border | `border-border/30` | `border-primary/15` |
| Geri butonu bg | `bg-primary/15` | `bg-primary/15` (aynı) |
| Kategori badge | `bg-black/50 text-white` | `bg-primary/80 text-primary-foreground` |
| Headphones ikon | `text-primary` | `text-primary` (aynı) |

Bu sayede non-featured guide'lar da kendi primary renk temasıyla tutarlı ve özel bir görünüm kazanır — featured'ın amber'ı gibi, ama primary palette'e dayalı.

### Değişecek Dosyalar

1. **`src/pages/GuideDetail.tsx`** — Sticky header okunabilirlik, geri butonu boyutu, non-featured tema renkleri
2. **`src/pages/AudioAccess.tsx`** — Geri butonu boyutu, sticky header okunabilirlik

