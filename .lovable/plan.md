

## Plan: GuideCard Tıklama ve Hızlı Sayfa Yükleme

### Sorun
1. Ana sayfada guide kartına tıklayınca `GuideDetail` sayfası açılıyor ama `isLoading: true` ile başlayıp Supabase sorgusu bitene kadar spinner gösteriyor → kullanıcı gecikme yaşıyor
2. Console loglarında `GuideDetail component loading` her navigasyonda 4-6 kez tekrarlanıyor → gereksiz re-render

### Çözüm: Navigation State ile Anlık Gösterim

Ana sayfa zaten tüm guide verilerini Supabase'den çekiyor. Bu veriyi React Router'ın `navigate` state'i ile GuideDetail'e aktaracağız. GuideDetail, state'ten gelen veriyi anında gösterecek, arka planda güncel veriyi Supabase'den çekecek.

### Yapılacak Değişiklikler

**1. `src/components/GuideCard.tsx`**
- `handleView` fonksiyonunda `navigate`'e guide verilerini state olarak ekle:
  ```
  navigate(`/guide/${slug || id}`, { state: { guidePreview: { id, slug, title, description, location, price, duration, category, imageUrl } } })
  ```

**2. `src/pages/GuideDetail.tsx`**
- `useLocation()`'dan `state.guidePreview` oku
- Eğer preview verisi varsa, `isLoading`'i `false` olarak başlat ve `realGuideData`'yı preview ile initialize et
- Supabase fetch arka planda çalışmaya devam edecek, gelince veriyi güncelleyecek
- `console.log('🔧 GuideDetail component loading')` satırını kaldır (gereksiz re-render spam'i)

**3. `src/pages/Index.tsx`**
- `GuideCard`'a zaten tüm gerekli prop'lar geçiriliyor, ek değişiklik gerekmez

### Akış
```text
Mevcut:  Kart tıkla → Navigate → Loading spinner (1-2s) → İçerik
Yeni:    Kart tıkla → Navigate → İçerik anında görünür → Arka plan güncelleme
```

### Etkilenen Dosyalar
- `src/components/GuideCard.tsx` — navigate state ekle
- `src/pages/GuideDetail.tsx` — location state'ten preview verisi oku

### Risk
Düşük. Mevcut fetch mantığı korunuyor, sadece başlangıç state'i optimize ediliyor.

