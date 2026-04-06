

## Plan: Content Management İyileştirmesi

### Değişiklikler

**1. `GuideManagement` bileşenini kaldır** — `AdminGuideOrderManager` zaten aynı işlevi (edit, preview, publish/hide, durum badge) daha kompakt sunuyor. `GuideManagement` gereksiz tekrar.

- `src/pages/AdminPanel.tsx`: `GuideManagement` import ve kullanımını kaldır, `<Separator />` sil
- `src/components/GuideManagement.tsx`: Silinebilir (artık kullanılmıyor)

**2. Dil badge'lerini emoji bayraklarla göster** — `AdminGuideOrderManager.tsx`'de `getLanguageFlag()` fonksiyonunu (`src/lib/language-utils.ts`) kullanarak dil kodları yerine bayrak emojileri göster. Tüm diller gösterilecek (4 limit kaldırılacak).

```tsx
import { getLanguageFlag } from '@/lib/language-utils';

// Mevcut: <span>EN</span>
// Yeni:   <span title="English">🇺🇸</span>
```

**3. Action butonlarına tooltip/label ekle** — Küçük icon butonların ne yaptığı daha net olsun:
- Kalem → `title="Düzenle"`
- Göz → `title="Önizle"`  
- Göz kapalı → `title="Gizle/Yayınla"`
- Buton renkleri: Edit → mavi tint, Publish toggle → yeşil/turuncu tint

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminGuideOrderManager.tsx` | Emoji bayraklar, tooltip'ler, renk iyileştirmesi |
| `src/pages/AdminPanel.tsx` | `GuideManagement` kaldır |

