

## Plan: Kart Boyutu Eşitleme, Sıralama Düzeltme ve Masaüstü Görünürlük

### Problem

1. **Kartlar farklı boyutlarda**: Ekran görüntüsünde ilk kart (384 min, 1 kullanıcı bilgisi var) diğerlerinden uzun. Açıklama ve metadata satırları farklı yükseklik oluşturuyor.
2. **Admin sıralama ≠ ana sayfa sırası**: Admin tüm guide'ları (linked, gizli, onaysız dahil) listelerken, ana sayfa sadece `published + approved + standalone` olanları gösteriyor.
3. **Masaüstünde tüm kartlar görünmüyor**: Carousel yapısı sınırlı sayıda kart gösteriyor.

### Çözüm

#### 1. GuideCard eşit yükseklik (`src/components/GuideCard.tsx`)
- Kart zaten `h-full flex flex-col` kullanıyor ama iç alanlar esnemeli:
  - Başlık: `line-clamp-2` + `min-h-[2.5rem]` ekle (2 satır yer ayır)
  - Açıklama: zaten `line-clamp-2` var, `min-h-[2.5rem]` ekle
  - Metadata satırı (location, duration, purchases): sabit min-height ver
- Bu sayede içerik az olan kartlar da aynı yüksekliğe esner

#### 2. Carousel item'larda eşit yükseklik (`src/pages/Index.tsx`)
- `CarouselItem` içindeki `GuideCard`'ı saran div'e `h-full` ekle
- `CarouselContent`'e `items-stretch` ekle (flexbox'ta tüm item'lar aynı yükseklikte olsun)

#### 3. Admin sıralama: sadece public guide'lar (`src/components/AdminGuideOrderManager.tsx`)
- `fetchGuides` sorgusuna `.eq('is_published', true).eq('is_approved', true).eq('is_standalone', true)` filtresi ekle
- Başlığı "Guide Order (Public)" olarak güncelle — kullanıcı neyi yönettiğini net görsün
- Bu sayede admin listesi ile ana sayfa birebir aynı subset ve sırayı gösterir

#### 4. Masaüstünde daha fazla kart görünürlüğü (`src/pages/Index.tsx`)
- Mevcut: `basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4`
- `2xl:basis-1/5` ekle — büyük ekranlarda 5 kart görünsün
- Carousel navigation okları zaten mevcut; mobilde de görünür yap: `className="flex -left-2 sm:-left-4"` (hidden kaldır)

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/GuideCard.tsx` | Başlık ve açıklamaya min-height ekle |
| `src/pages/Index.tsx` | CarouselContent'e items-stretch, büyük ekran basis, mobil oklar |
| `src/components/AdminGuideOrderManager.tsx` | fetchGuides'a public filtresi ekle |

