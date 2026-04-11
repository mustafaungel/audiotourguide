

## Get Full Access — Tüm Rehberler İçin Amber/Altın Tasarım

### Değişiklik

Şu anda featured rehberler için uygulanan amber/altın tasarımı **tüm rehberler** için varsayılan yapılacak. `isFeaturedGuide` koşulları kaldırılıp her rehberde aynı premium görünüm kullanılacak.

**`src/pages/GuideDetail.tsx`** — Satır 917-942

| Eleman | Şimdi (standart) | Yeni (tümü) |
|--------|------------------|-------------|
| Container border | `border-border/40` | `border-amber-500/30 bg-amber-500/5` |
| Üst bant gradyanı | `from-primary via-primary/90 to-primary` | `from-amber-500 via-yellow-500 to-amber-500` |
| İkon/metin rengi | `text-primary-foreground` | `text-amber-50` |
| Already Purchased | `text-green-600` | `text-amber-600` |

Tüm `isFeaturedGuide ? ... : ...` ternary'leri kaldırılıp sadece amber değerleri kalacak.

### Teknik Özet

```
1 dosya: src/pages/GuideDetail.tsx
  - Satır 917: border-amber-500/30 bg-amber-500/5 (koşulsuz)
  - Satır 918: from-amber-500 via-yellow-500 to-amber-500 (koşulsuz)
  - Satır 919-920: text-amber-50 (koşulsuz)
  - Satır 924: text-amber-600 (koşulsuz)
```

