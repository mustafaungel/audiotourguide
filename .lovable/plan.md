

## Plan: Site Temizliği ve Performans İyileştirmeleri

### Sorunlar

1. **URL'de versiyon parametreleri** (`?v=2025-11-06-v3&t=...`) — `App.tsx`'teki cache-busting mekanizması URL'ye `v=` ve `t=` parametreleri ekliyor ve her sayfa yüklenişinde `window.location.replace` ile yeniden yüklüyor. Bu hem URL'yi kirletiyor hem de gereksiz reload'lara neden oluyor.

2. **"Static OK" badge** — `public/healthcheck.js` sağ alt köşeye sabit bir "Static OK" div ekliyor. Bu bir debug aracı, production'da görünmemeli.

3. **Sayfa her sekme değişiminde refresh atıyor** — Yine aynı cache-busting mekanizması: URL'de `v=` parametresi yoksa veya `APP_BUILD` değişmişse `window.location.replace` çağırıyor. Bu, React Router ile navigasyon yaparken bile tetiklenebiliyor.

### Yapılacaklar

**1. Cache-busting mekanizmasını kaldır** (`src/App.tsx`)
- `useEffect` içindeki tüm cache-busting bloğunu (satır 30-50) sil
- `APP_BUILD` import'unu kaldır
- Vite zaten dosya adlarına hash ekliyor (`[name]-[hash]-v3.js`), bu yeterli

**2. `APP_BUILD` sabitini kaldır** (`src/lib/utils.ts`)
- `export const APP_BUILD = '2025-11-06-v3';` satırını sil

**3. Healthcheck badge'ini kaldır** (`public/healthcheck.js`)
- `addBadge()` fonksiyonunu ve çağrısını tamamen sil
- Sadece `ensureRootPlaceholder()` ve console log'u bırak (ya da dosyayı tamamen sil)

**4. `index.html` temizliği**
- `<meta http-equiv="Cache-Control" ...>` satırlarını kaldır (gereksiz, CDN cache'i bunlarla yönetilmez)
- `<script defer src="/healthcheck.js"></script>` satırını kaldır (badge kaldırıldığı için)

### Etki
- URL temiz kalacak (`/`, `/guides`, `/guide/slug` vs.)
- Sağ alttaki "Static OK" yazısı kaybolacak
- Sekme değiştirirken veya sayfa açarken gereksiz reload olmayacak
- Vite'ın hash'li dosya adları cache-busting için yeterli

