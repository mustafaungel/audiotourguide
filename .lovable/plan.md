

## Plan: Sayfa Geçişlerinde Otomatik Scroll to Top

### Sorun
Projede `ScrollToTop` bileşeni yok. Ana sayfada aşağı kaydırıp bir guide'a tıklayınca, yeni sayfa eski scroll pozisyonuyla açılıyor — kullanıcı sayfanın altında kalıyor.

### Çözüm

**1. `src/components/ScrollToTop.tsx` oluştur**
- `useLocation` ile route değişikliğini dinle
- `useEffect` içinde `window.scrollTo({ top: 0, left: 0 })` çağır

**2. `src/App.tsx` — ScrollToTop ekle**
- `BrowserRouter` içine, `<Suspense>` öncesine `<ScrollToTop />` ekle

### Etkilenen Dosyalar
- `src/components/ScrollToTop.tsx` (yeni)
- `src/App.tsx` (1 satır import + 1 satır bileşen)

### Risk
Sıfır. Tüm sayfa geçişlerinde otomatik yukarı scroll sağlar.

