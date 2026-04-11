

## GuideDetail Tema Flash Düzeltmesi + Badge Ekolayzır Kaldırma

### Problem 1: Tasarım "sonradan yükleniyormuş gibi" görünüyor
`GuideCard`'dan navigasyon sırasında `guidePreview` objesi aktarılıyor ama `is_featured` bilgisi dahil değil. Sayfa ilk açıldığında `isFeaturedGuide = false` oluyor (primary tema), ardından gerçek veri yüklenince `is_featured = true` ile amber temaya geçiyor — bu geçiş "flash" yaratıyor.

**Çözüm:** `GuideCard`'ın `guidePreview` objesine `isFeatured` bilgisini ekle, `GuideDetail`'da bunu kullan.

### Problem 2: LiveListenersBadge ekolayzer kaldırma
Default size'da MiniEqualizer gösteriliyor. Yerine kulaklık ikonuna yavaş bir `animate-pulse` eklenecek.

### Değişiklikler

**1. `src/components/GuideCard.tsx` (satır 56)**
```
Önce:  guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl }
Sonra: guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl, isFeatured }
```

**2. `src/pages/GuideDetail.tsx` (satır 50-67)**
Preview data'dan `is_featured` bilgisini al:
```tsx
const [realGuideData, setRealGuideData] = useState<any>(guidePreview ? {
  ...mevcut alanlar,
  is_featured: guidePreview.isFeatured || false,
} : null);
```

**3. `src/components/LiveListenersBadge.tsx` (satır 34-35)**
Ekolayzer yerine pulse animasyonlu kulaklık:
```
Önce:  {!isCompact && <MiniEqualizer />}
       <Headphones className={`${iconSize} shrink-0`} />
Sonra: <Headphones className={`${iconSize} shrink-0 animate-pulse`} />
```
`animate-pulse` Tailwind'in varsayılan 2s süreli yavaş pulse animasyonu — tam istenen etki.

### Özet
- 3 dosya, minimal değişiklik
- Flash sorunu kökten çözülür (preview'da tema bilgisi taşınır)
- Badge'de ekolayzer kalkar, kulaklık yavaşça yanıp söner

