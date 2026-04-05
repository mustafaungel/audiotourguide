

## Plan: Sayfa Yükleme, Logo Gecikmesi ve Sekme Değişim Sorunları

### Tespit Edilen Sorunlar

**1. Branding (logo) her sayfada tekrar tekrar Supabase'den çekiliyor**
- `useSiteBranding` hook'u her çağrıldığında yeni bir Supabase sorgusu yapıyor (useState + useEffect)
- Bu hook 3 farklı yerde bağımsız çağrılıyor: `FaviconUpdater`, `PreloadBrandingAssets`, `ResponsiveLogo`
- Sonuç: sayfa açılışında minimum 3 paralel Supabase isteği sadece logo için
- `ResponsiveLogo` loading sırasında Skeleton gösteriyor → logo geç görünüyor

**2. Library sayfasında `window.location.href` kullanılıyor**
- `Library.tsx` satır 62: `window.location.href = url` → tam sayfa yeniden yükleme
- React Router yerine hard navigation yapıyor → tüm uygulama sıfırdan yükleniyor

**3. Tüm sayfalar eager import ediliyor**
- `App.tsx`'te 12 sayfa doğrudan import ediliyor, hiçbiri lazy değil
- İlk yüklemede tüm sayfaların JS'i indirilip parse ediliyor

**4. Her sayfa bağımsız Supabase sorguları yapıyor**
- Index: guides + purchases + homepage_stats
- GuideDetail: guide + profile + sections + languages + linked guides + related guides
- Her navigasyonda bu sorgular tekrarlanıyor (react-query cache kullanılmıyor, ham useEffect)

### Yapılacaklar

**1. Branding'i React Context'e taşı (tek sorgu, paylaşımlı)**
- Yeni `BrandingProvider` oluştur, `App.tsx`'e ekle
- `useSiteBranding` hook'u bu context'ten okusun (Supabase sorgusu sadece 1 kez)
- `FaviconUpdater`, `PreloadBrandingAssets`, `ResponsiveLogo` hepsi aynı cache'i kullansın
- Logo URL'sini `<link rel="preload">` ile `index.html`'e ekleyemeyiz (dinamik), ama context sayesinde tek sorgu + anında paylaşım olacak

**2. ResponsiveLogo'daki Skeleton gecikmesini düzelt**
- Branding zaten context'ten gelecek (hızlı)
- İlk render'da `brandingLoading` ise kısa skeleton, sonra direkt logo göster
- `PreloadBrandingAssets` zaten image'ı preload ediyor, `imgLoaded` kontrolü gereksiz gecikme yaratıyor → branding yüklendi ve URL varsa direkt `<img>` render et (tarayıcı cache'ten alır)

**3. `window.location.href` → `navigate()` değiştir**
- `Library.tsx` satır 62: `window.location.href = url` → `navigate(url)` (React Router)
- Bu tek değişiklik Library→AudioAccess geçişindeki tam yeniden yüklemeyi engelleyecek

**4. Sayfa lazy loading ekle**
- `App.tsx`'teki tüm page import'larını `React.lazy()` ile değiştir
- `<Suspense fallback={...}>` ile sar — fallback minimal olacak (sadece küçük spinner, tam ekran loading değil)
- Index sayfası hariç (ilk yükleme için eager kalabilir)

**5. QueryClient cache ayarlarını optimize et**
- `staleTime: 5 * 60 * 1000` (5 dk) ekle → aynı veri tekrar çekilmesin
- Mevcut ham useEffect sorgularını değiştirmiyoruz (çok fazla dosya), sadece branding context'i ve QueryClient defaults yeterli

### Etkilenen Dosyalar
- `src/hooks/useSiteBranding.ts` — context provider'a dönüştür
- `src/App.tsx` — BrandingProvider ekle, lazy imports
- `src/components/ResponsiveLogo.tsx` — skeleton mantığını sadeleştir
- `src/components/PreloadBrandingAssets.tsx` — context'ten oku
- `src/components/FaviconUpdater.tsx` — context'ten oku
- `src/pages/Library.tsx` — `window.location.href` → `navigate()`

### Risk
- Düşük. Mevcut işlevsellik korunuyor, sadece veri çekme ve navigasyon mekanizması optimize ediliyor.

