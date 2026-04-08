
## Plan: GuideCard Sabit Yükseklik Düzeltmesi

### Problem
Ekran görüntülerinde açıkça görülüyor: ilk kart ("Discover Hidden Valleys") 2 satır başlık + 2 satır açıklama ile diğerlerinden uzun. `min-h-[2.5rem]` sadece minimum yükseklik belirliyor — içerik 2 satıra çıktığında alan büyüyor ve kartlar eşitsizleşiyor.

### Kök Neden
- `min-h` minimum garanti eder ama maksimum sınırlamaz
- `sm:text-lg` ile 2 satırlık başlık 2.5rem'den fazla yer kaplıyor
- `leading-relaxed` ile açıklama da taşıyor

### Çözüm (`src/components/GuideCard.tsx`)

Her metin alanına **sabit yükseklik** (`h-[...]`) + `overflow-hidden` uygula:

1. **Başlık**: `min-h-[2.5rem]` → `h-[2.75rem] sm:h-[3.25rem]` + `overflow-hidden` — her zaman tam 2 satırlık alan (font boyutuna göre hesaplanmış)
2. **Açıklama**: `min-h-[2.5rem]` → `h-[2.5rem] sm:h-[3rem]` + `overflow-hidden` — tam 2 satır
3. **Metadata**: zaten `h-[1.5rem]` sabit — doğru

Bu sayede içerik 1 satır da olsa 2 satır da olsa kart yüksekliği aynı kalır.

### Dosya
| Dosya | Değişiklik |
|-------|-----------|
| `src/components/GuideCard.tsx` | Başlık ve açıklama `min-h` → sabit `h` + `overflow-hidden` |
