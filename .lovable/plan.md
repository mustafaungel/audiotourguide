

## Plan: Guide Detay Sayfası Geçiş Kalitesini İyileştirme

### Sorun (Videoda Görülen)
Ana sayfadan bir guide'a tıklandığında:
1. **Slug/ID uyumsuzluğu**: `FeaturedGuides.tsx` `guide.id` ile navigate ediyor ama `GuideDetail.tsx` URL'den `slug` alıp `slug` ile sorgu yapıyor — eşleşme başarısız olabilir
2. **Preview → Gerçek veri geçişinde layout kayması**: Preview veride `creator: { name: 'Loading...' }`, `sections: []`, `languages: []` var — gerçek veri gelince tüm sayfa kayıyor/titriyyor
3. **Hero image alanında loader**: Loading skeleton'da hero image yerine `AudioGuideLoader variant="page"` konmuş — aspect-video container içinde tam sayfa loader çirkin gözüküyor

### Değişiklikler

**1. `src/components/FeaturedGuides.tsx` — Slug ile navigate et**
- Interface'e `slug` ekle
- Select query'e `slug` ekle  
- Navigate URL'ini `guide.slug || guide.id` olarak güncelle
- `guidePreview` state'e `slug` ekle

**2. `src/pages/GuideDetail.tsx` — Layout shift'i ortadan kaldır**

**Loading skeleton'ı düzelt (satır 577-625):**
- Hero image alanında `AudioGuideLoader variant="page"` yerine düz shimmer/pulse animasyonu kullan (gerçek sayfadaki aspect-video ile aynı boyut)
- Skeleton yapısını gerçek sayfayla birebir aynı tut (Navigation → Back → Grid → Hero + Info Card + Sidebar)

**Preview render'da eksik alanları gizle:**
- `creator.name === 'Loading...'` ise creator bölümünü skeleton olarak göster (yazı yerine pulse bar)
- `sections.length === 0` ise chapters tab'ında "Loading chapters..." skeleton göster
- `languages.length === 0` ise language selector'ı gizle (gerçek veri gelince göster)
- Bu sayede "Loading..." yazısı hiç görünmeyecek ve gerçek veri gelince layout değişmeyecek

**Min-height sabitleme:**
- Hero image container'a `min-h-[200px] md:min-h-[300px]` ekle
- Guide info card'a `min-h-[120px]` ekle
- Sidebar price card'a `min-h-[200px]` ekle

**3. `src/pages/FeaturedGuides.tsx` — Slug ile navigate et**
- Interface'e `slug` ekle, select query'e ekle
- Navigate URL'ini `guide.slug || guide.id` olarak güncelle

### Etkilenen Dosyalar
- `src/components/FeaturedGuides.tsx` — slug ekleme
- `src/pages/FeaturedGuides.tsx` — slug ekleme  
- `src/pages/GuideDetail.tsx` — loading skeleton düzeltme + preview render'da conditional skeleton

### Sonuç
- Tıklama anında sayfa açılır, preview veriyle hero image + başlık + konum anında görünür
- Eksik alanlar (creator, chapters, languages) skeleton olarak gösterilir — "Loading..." yazısı yok
- Gerçek veri gelince skeleton → içerik geçişi kayma olmadan gerçekleşir

