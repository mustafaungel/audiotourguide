

## Plan: GuideCard Anlık Navigasyon + Ana Sayfa Cache + Tüm Sayfalar Tutarlılık

### Sorun 1: Kart tıklandığında yavaş yönlendirme
`GuideCard.handleView` fonksiyonunda `await trackEngagement('view', id)` çağrısı **Supabase Edge Function** çağırıyor ve navigate'den ÖNCE bekliyor. Edge function yanıt verene kadar (500ms-2s) navigasyon gerçekleşmiyor.

### Sorun 2: GuideDetail lazy-load gecikmesi
`GuideDetail` sayfası `React.lazy` ile yükleniyor. İlk tıklamada JS chunk'ı indirilmesi gerekiyor → ek gecikme.

### Sorun 3: Ana sayfa her seferinde sıfırdan yükleniyor
`Index.tsx` her açıldığında Supabase'den guide listesini çekiyor, `loading: true` ile başlıyor.

### Sorun 4: BrandingContext cache varken loading tetikliyor
`loadBranding` fonksiyonunda cache olsa bile `setLoading(true)` çağrılıyor.

---

### Yapılacak Değişiklikler

**1. `src/components/GuideCard.tsx`** — trackEngagement'ı await etme
- `handleView` fonksiyonunda `trackEngagement` çağrısını **fire-and-forget** yap (await kaldır)
- Önce `navigate` çağır, tracking arka planda çalışsın
- Aynı şekilde `handleBookmark` ve `handleShare`'de de await'leri kaldır

**2. `src/App.tsx`** — GuideDetail'i preload et
- GuideDetail chunk'ını sayfa yüklendikten sonra arka planda preload et (`import()` ile)
- Kullanıcı karta tıkladığında chunk zaten indirilmiş olacak

**3. `src/contexts/BrandingContext.tsx`** — Cache varken loading tetikleme
- `loadBranding` fonksiyonunda: cache varsa `setLoading(true)` çağırma
- Arka planda sessizce güncelle, UI hiç titremeyecek

**4. `src/pages/Index.tsx`** — Guides listesi localStorage cache
- Guide verileri çekildikten sonra `localStorage`'a kaydet
- Component mount'ta cache varsa anında göster, `loading: false` ile başla
- Arka planda Supabase sorgusu çalışıp veriyi güncellesin

**5. `src/pages/Guides.tsx`** — Aynı cache pattern'i
- Index ile aynı yaklaşım

**6. `src/pages/AudioAccess.tsx`** — Navigation state ile preview
- GuideDetail'den erişim sayfasına geçerken guide preview verisini state ile aktar

### Akış
```text
Mevcut:  Kart tıkla → trackEngagement bekle (1-2s) → Lazy load bekle → Navigate → Loading spinner → İçerik
Yeni:    Kart tıkla → Anında navigate → Cache'ten anında içerik → Arka plan güncelleme
```

### Etkilenen Dosyalar
- `src/components/GuideCard.tsx` — await kaldır, fire-and-forget tracking
- `src/App.tsx` — GuideDetail preload
- `src/contexts/BrandingContext.tsx` — cache varken loading skip
- `src/pages/Index.tsx` — guides cache
- `src/pages/Guides.tsx` — guides cache
- `src/pages/AudioAccess.tsx` — navigation state

### Risk
Düşük. Tracking verisi kaybı yok (fire-and-forget hala çalışır), cache stale olabilir ama arka plan güncelleme bunu çözer.

