

## 2 Düzeltme: Kart Başlık Taşması + Detay Sayfası Başlık Tekrarı

### 1. GuideCard Başlık Taşması

**Problem:** `uppercase` dönüşümü büyük harflerle yazınca başlıklar genişliyor ve `truncate` olsa bile sığmıyor — çirkin görünüyor.

**Çözüm:** `uppercase` kaldırılacak. Başlık doğal haliyle (capitalize/normal) kalacak. Font weight ve drop-shadow korunacak.

**Dosya:** `src/components/GuideCard.tsx` satır 82
- `uppercase` kaldır
- `text-[12px] font-extrabold font-heading truncate tracking-normal text-primary-foreground drop-shadow-sm` olarak kalacak

### 2. Guide Detail — Başlık Tekrarı Kaldırma

**Problem:** Sticky header'da zaten rehber adı yazıyor. Aşağıda görsel yanındaki `h1` başlık + "listening now" badge'i gereksiz tekrar oluşturuyor.

**Çözüm:** `h1` başlığı kaldırılacak. LiveListenersBadge korunacak (başlığın yerine, görselin yanında metadata ile birlikte kalacak).

**Dosya:** `src/pages/GuideDetail.tsx` satır 698
- `<h1>` satırını kaldır
- LiveListenersBadge ve metadata (location, duration) yukarı kayacak

### Teknik Özet

```
2 dosya:

src/components/GuideCard.tsx (satır 82)
  - uppercase kaldır

src/pages/GuideDetail.tsx (satır 698)
  - h1 başlık satırını kaldır
```

