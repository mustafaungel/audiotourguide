

## Guides Listeleme — "Load More" ile Kademeli Yükleme

### Problem

Şu anda hem Index hem Guides sayfasında tüm rehberler tek seferde çekiliyor ve render ediliyor. 10-20 rehberde sorun yok, ama 50+ rehbere ulaşıldığında:
- İlk render yavaşlar (tüm kartlar + görseller aynı anda DOM'a eklenir)
- Mobilde scroll performansı düşer
- Veri transferi gereksiz büyür

### Çözüm: Client-Side "Load More"

Veritabanı sorgusuna dokunmadan, mevcut verileri client tarafında sayfalayarak göstermek en temiz çözüm. Neden server-side pagination değil? Çünkü filtreleme ve arama zaten client-side çalışıyor — ikisini karıştırmak karmaşıklık getirir.

**Mantık:**
- İlk açılışta 9 rehber göster (mobilde 3x3 grid)
- "Load More" butonuna basınca 9 tane daha ekle
- Filtreleme/arama yapılınca sayaç sıfırlansın, sonuçlar baştan gösterilsin
- Tüm rehberler gösterildiyse buton kaybolsun

### Uygulanacak Sayfalar

| Sayfa | Değişiklik |
|-------|-----------|
| **Guides.tsx** | `visibleCount` state + "Load More" butonu |
| **Index.tsx** | `visibleCount` state + "Load More" butonu |
| **FeaturedGuides.tsx** | Zaten az sayıda rehber — değişiklik yok |

### Teknik Özet

```
2 dosya:

src/pages/Guides.tsx
  - visibleCount state (başlangıç: 9)
  - filteredGuides.slice(0, visibleCount) ile render
  - searchTerm veya selectedCategory değişince visibleCount = 9
  - "Show More Guides" butonu (kalan sayıyı gösterir)

src/pages/Index.tsx
  - visibleCount state (başlangıç: 9)
  - filteredGuides.slice(0, visibleCount) ile render
  - Filtre değişince visibleCount = 9
  - "Show More" butonu
```

### "Load More" Buton Tasarımı

Mevcut CTA bölümüyle uyumlu, minimal:
- `variant="outline"` + tam genişlik mobilde
- "Show 9 More Guides (24 remaining)" gibi bilgilendirici metin
- Tüm rehberler gösterildiyse buton gizlenir

