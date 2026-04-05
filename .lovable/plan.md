

## Plan: Ana Sayfada Yatay Kaydırmalı Guide Carousel

### Sorun
Ana sayfada (Index) guide kartları `grid-cols-1` ile alt alta listeleniyor. Mobilde tek tek kaydırmak zahmetli ve alan verimsiz kullanılıyor.

### Çözüm
`src/pages/Index.tsx` dosyasındaki guide grid'ini mobilde Embla Carousel'e dönüştür. Zaten projede `FeaturedGuides.tsx`'te kullanılan carousel pattern'i aynen uygula.

### Değişiklikler — `src/pages/Index.tsx`

**1. Grid'i Carousel'e dönüştür (mobilde):**
- `grid grid-cols-1` → `Carousel` + `CarouselContent` + `CarouselItem` yapısı
- Her kart `basis-[85%]` ile ekranın %85'ini kaplayacak, yanındaki kartın kenarı görünecek (kaydırma ipucu)
- `loop: true`, `align: "start"` — sonsuz döngü, kolay swipe
- Desktop'ta (`sm:basis-1/2 lg:basis-1/3`) yan yana gösterim korunur

**2. Kartların eşit boyutta olması:**
- `CarouselItem` içinde `h-full` class'ı ile tüm kartlar aynı yükseklikte
- `GuideCard`'a `className="h-full"` prop'u geçilecek (Card zaten flex column yapabilir)

**3. GuideCard'da eşit yükseklik desteği:**
- `src/components/GuideCard.tsx` — Root `Card` elementine `h-full flex flex-col` ekle
- `CardContent`'e `flex-1` ekleyerek içeriğin esnemesini sağla
- Böylece tüm kartlar carousel'de aynı boyutta olur

**4. Performans:**
- Carousel zaten `overflow-hidden` kullanıyor, sadece görünen kartlar render ediliyor
- `OptimizedImage` ile `loading="lazy"` mevcut
- LocalStorage cache (`GUIDES_CACHE_KEY`) zaten mevcut — anında render
- Ek performans değişikliği gerekmez

### Etkilenen Dosyalar
- `src/pages/Index.tsx` — grid → carousel dönüşümü
- `src/components/GuideCard.tsx` — `h-full flex flex-col` eşit yükseklik desteği

### Beklenen Sonuç
- Mobilde sağa-sola parmakla kaydırarak guide'lar arası geçiş
- Tüm kartlar aynı boyutta
- Yanındaki kartın kenarı görünerek kaydırma ipucu verir
- Mevcut performans optimizasyonları korunur

