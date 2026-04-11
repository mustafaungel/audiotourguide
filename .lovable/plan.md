

## 3 İyileştirme: Görsel Yükleme + Load More Sayısı + Kart Tipografisi

### 1. Görsel Yükleme (Country Detail)

Kontrol ettim — `/country/turkey` sayfasında görseller düzgün yükleniyor. Zelve kartındaki gecikme lazy loading'den kaynaklanıyordu. Ancak `OptimizedImage` bileşeninde bir iyileştirme yapılabilir: `onError` handler eklenerek kırık görseller için fallback placeholder gösterilecek. Bu, ileride gerçekten bozuk URL'li rehberler olursa sayfanın düzgün görünmesini sağlar.

### 2. Load More — 9 → 6

Her iki sayfada `visibleCount` başlangıcı 9'dan **6**'ya düşürülecek. Load More'daki artış da 6 olacak.

| Dosya | Değişiklik |
|-------|-----------|
| `Index.tsx` | `useState(9)` → `useState(6)`, `prev + 9` → `prev + 6` |
| `Guides.tsx` | `useState(9)` → `useState(6)`, `prev + 9` → `prev + 6` |

### 3. GuideCard Tipografi — Daha Zengin, Premium Görünüm

Şu anda kartlardaki metinler çok sade: `text-xs text-muted-foreground` — sönük ve düz. Yapılacak iyileştirmeler:

**`GuideCard.tsx`:**

- **Lokasyon metni**: `text-xs text-muted-foreground` → `text-xs font-semibold text-foreground/80` — daha koyu ve belirgin
- **Süre metni**: `text-xs text-muted-foreground` → `text-xs font-medium text-foreground/60` — hafif ama okunabilir
- **Üst band başlık**: `text-xs font-extrabold` → `text-[13px] font-extrabold tracking-wide uppercase` — daha etkili
- **Kategori badge**: `text-[9px]` → `text-[10px] font-semibold` — biraz daha okunabilir
- **Kart hover'da**: hafif `shadow-tourism` efekti eklenerek derinlik hissi

**`index.css`'e yeni utility (isteğe bağlı):**
- `.card-text-shadow`: `text-shadow: 0 1px 2px hsl(0 0% 0% / 0.08)` — metin derinlik efekti (açık modda ince, koyu modda güçlü)

### Teknik Özet

```
3 dosya:

src/components/OptimizedImage.tsx
  - onError handler → fallback placeholder

src/components/GuideCard.tsx
  - Font weight artışları (semibold/medium)
  - Text renk kontrastı artışı (foreground/80)
  - Üst band: text-[13px] uppercase tracking-wide
  - Badge: text-[10px] font-semibold
  - Hover shadow iyileştirme

src/pages/Index.tsx
  - visibleCount: 9 → 6

src/pages/Guides.tsx
  - visibleCount: 9 → 6
```

