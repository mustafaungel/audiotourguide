

## Featured Guide — "Get Full Access" Özel Tasarım

### Mevcut Durum

"Get Full Access" kutusu tüm rehberler için aynı: `bg-gradient-to-r from-primary via-primary/90 to-primary` gradyanı ve standart primary renk. Featured rehberlerde sticky header, kategori badge'i ve geri butonu zaten amber/altın tonlarına dönüşüyor — ama satın alma kutusu standart kalıyor.

### Yapılacak Değişiklik

**`src/pages/GuideDetail.tsx`** — Satır 917-942 arası "Get Full Access" bloğu

Featured rehberler için:
- Dış border: `border-amber-500/30` (altın çerçeve)
- Üst bant gradyanı: `from-amber-500 via-yellow-500 to-amber-500` (altın gradyan)
- İkon ve metin rengi: `text-amber-50`
- "Already Purchased" durumunda da amber tonları
- Kutu içine hafif `bg-amber-500/5` arka plan

Standart rehberler için mevcut tasarım korunur.

Koşul zaten mevcut: `isFeaturedGuide` değişkeni (satır 86).

### Teknik Özet

```
1 dosya: src/pages/GuideDetail.tsx
  - Get Full Access container border: isFeaturedGuide ? border-amber-500/30 : border-border/40
  - Üst bant gradyanı: isFeaturedGuide ? amber/yellow : primary
  - İç alan arka planı: isFeaturedGuide ? bg-amber-500/5 : varsayılan
  - Already Purchased rengi: isFeaturedGuide ? text-amber-600 : text-green-600
```

