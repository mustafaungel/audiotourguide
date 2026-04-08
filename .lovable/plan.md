

## Plan: Kart Yükseklik Eşitleme — Kök Neden Düzeltme

### Problem
Ekran görüntüsünde ilk kart ("Discover Hidden Valleys") diğerlerinden uzun. Sebebi:
- `totalPurchases > 0` olan kartlarda Users ikonu gösteriliyor, metadata satırı 2 satıra sarıyor
- Diğer kartlarda bu ikon yok → metadata tek satır → kart daha kısa
- `min-h-[1.5rem]` bu farkı karşılamıyor çünkü wrapping 2 satır oluşturuyor

### Çözüm

**`src/components/GuideCard.tsx`** — iki değişiklik:

1. **Metadata satırını `flex-nowrap overflow-hidden`** yap — böylece içerik ne olursa olsun tek satırda kalır, taşan kısım gizlenir
2. **Veya** `totalPurchases` gösterimini kaldırıp kartları tamamen eşitle (daha temiz)

Önerilen yaklaşım: metadata satırına `flex-nowrap` ekle ve `min-h-[1.5rem]` yerine sabit `h-[1.5rem]` kullan. Bu sayede tüm kartlar aynı yükseklikte olur.

### Değişiklik

| Dosya | Satır | Değişiklik |
|-------|-------|-----------|
| `src/components/GuideCard.tsx` | 176 | `flex-wrap` → `flex-nowrap overflow-hidden h-[1.5rem]` |

Tek satırlık değişiklik — metadata her zaman tek satırda kalacak, kart yükseklikleri eşitlenecek.

