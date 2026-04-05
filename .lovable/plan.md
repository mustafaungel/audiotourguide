

## Plan: Audio Guide Temalı Profesyonel Yükleme Ekranları

### Mevcut Durum
Tüm yükleme ekranları generic spinner veya gri pulse bloklardan oluşuyor — audio guide temasıyla hiçbir bağlantısı yok.

### Çözüm

**1. Yeni Bileşen: `src/components/AudioGuideLoader.tsx`**

Tek bir merkezi loader bileşeni, farklı varyantlarla:

**`variant="page"` — Tam sayfa yüklemeleri (GuideDetail, AudioAccess)**
- Merkezi kulaklık ikonu (Headphones from lucide) + altında 5 çubuklu ses dalgası (equalizer) animasyonu
- Çubuklar staggered delay ile yukarı-aşağı hareket edecek (CSS keyframes)
- Altında bağlama uygun mesaj (prop ile geçilecek)
- Mesaj örnekleri:
  - GuideDetail: *"Preparing your audio experience..."*
  - AudioAccess: *"Unlocking your audio tour..."*
  - PaymentSuccess: *"Confirming your purchase..."*

**`variant="card"` — Skeleton kart yüklemeleri (Index, Guides, FeaturedGuides)**
- Kart şeklinde skeleton ama köşede küçük kulaklık ikonu pulse efektiyle
- Üst kısımda ses dalgası çizgisi (ince çubuklar) animasyonu
- Alt kısımda metin satırları skeleton olarak kalır

**`variant="grid"` — Ülke grid yüklemesi (Countries)**
- Yuvarlak placeholder + küçük ses dalgası ikonu

**`variant="initial"` — App ilk yükleme (App.tsx PageLoader)**
- Minimal: sadece kulaklık ikonu + ses dalgası, mesaj yok

**2. `index.html` — İlk yükleme (React öncesi)**
- Mevcut basit spinner yerine inline CSS ile kulaklık SVG + ses dalgası animasyonu
- Altında *"Tuning in..."* yazısı, fade-in efektiyle
- Tamamen inline (dış bağımlılık yok, React öncesi çalışır)

**3. `src/index.css` — Yeni keyframes**
```css
@keyframes audio-wave {
  0%, 100% { height: 4px; }
  50% { height: 20px; }
}
```
5 çubuk, her biri 0.1s delay farkıyla

**4. Entegrasyon — Tüm sayfalar**

| Dosya | Mevcut | Yeni |
|-------|--------|------|
| `index.html` | Basit spinner | Kulaklık + ses dalgası + "Tuning in..." |
| `App.tsx` PageLoader | Düz spinner | `AudioGuideLoader variant="initial"` |
| `Index.tsx` loading | Gri pulse bloklar | `AudioGuideLoader variant="card"` x6 |
| `Guides.tsx` loading | Gri pulse bloklar | `AudioGuideLoader variant="card"` x6 |
| `GuideDetail.tsx` loading | Spinner + "Loading guide details..." | `AudioGuideLoader variant="page" message="Preparing your audio experience..."` |
| `AudioAccess.tsx` loading | Spinner + "Verifying access..." | `AudioGuideLoader variant="page" message="Unlocking your audio tour..."` |
| `PaymentSuccess.tsx` verifying | Spinner + "Verifying Payment..." | `AudioGuideLoader variant="page" message="Confirming your purchase..."` |
| `FeaturedGuides.tsx` loading | Gri pulse kartlar | `AudioGuideLoader variant="card"` x6 |
| `Countries.tsx` loading | Gri pulse kartlar | `AudioGuideLoader variant="grid"` x12 |
| `CountryDetail.tsx` loading | (kontrol edilecek) | `AudioGuideLoader variant="card"` |

### Mesaj Sistemi
Her loading ekranı bağlamına uygun, audio guide temalı mesajlar gösterecek:
- *"Tuning in..."* — İlk app yüklemesi
- *"Preparing your audio experience..."* — Guide detay
- *"Unlocking your audio tour..."* — Erişim doğrulama
- *"Confirming your purchase..."* — Ödeme doğrulama
- *"Discovering audio guides..."* — Liste yüklemeleri

### Renk ve Stil
- Primary renk (turuncu) gradient kullanılacak
- Dark mode tam uyumlu (CSS variables ile)
- Kulaklık ikonu lucide-react'tan, animasyonlu opacity pulse
- Ses dalgası çubukları `rounded-full`, primary gradient

### Etkilenen Dosyalar
- `src/components/AudioGuideLoader.tsx` (yeni)
- `src/index.css` (keyframes ekleme)
- `index.html` (inline loader güncelleme)
- `src/App.tsx`
- `src/pages/Index.tsx`
- `src/pages/Guides.tsx`
- `src/pages/GuideDetail.tsx`
- `src/pages/AudioAccess.tsx`
- `src/pages/PaymentSuccess.tsx`
- `src/pages/FeaturedGuides.tsx`
- `src/pages/Countries.tsx`
- `src/pages/CountryDetail.tsx`

### Memory Kaydı
Uygulama sonrasında şu tasarım kararı memory olarak kaydedilecek:
> Tüm yükleme ekranları audio guide temalı olmalı — kulaklık ikonu, ses dalgası animasyonu ve bağlama uygun mesajlar kullanılmalı. Generic spinner veya düz skeleton kullanılmamalı.

### Risk
Sıfır. Sadece görsel değişiklik, işlevsellik korunuyor.

