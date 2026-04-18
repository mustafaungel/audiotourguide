

## Mobil Hız Kontrolü & İyileştirme Planı

Hedef: Mevcut çalışan hiçbir özelliği bozmadan, mobilde (390x844) ölçülebilir performans iyileştirmeleri yapmak. Önce **ölçüm**, sonra **risk-sıfır iyileştirmeler**.

### Faz 1 — Ölçüm (Salt-Okuma, Kod Değişikliği YOK)

Mevcut durumu objektif olarak çıkaracağım:

1. **Lighthouse-tarzı tarama** (browser tools ile mobil viewport'ta)
   - Anasayfa (`/`)
   - Rehber listesi (`/guides`)
   - Rehber detay (`/guide/:slug` — örnek bir featured guide)
   - Audio access (`/access/:guideId` — en ağır sayfa)

2. **Toplanacak metrikler**:
   - İlk yükleme süresi (DOMContentLoaded, Load)
   - JS bundle boyutu (network requests)
   - Render-blocking kaynaklar
   - Görsel ağırlığı (image sizes, LCP candidate)
   - Re-render sayıları (React Profiler değil, console + performance API)
   - JS heap kullanımı, DOM node sayısı
   - Console hataları/uyarıları

3. **Statik analiz**:
   - `vite.config.ts` mevcut chunk strategy
   - Lazy-load edilmemiş heavy bileşenler
   - Re-render tetikleyen context'ler (Auth, Branding)
   - useEffect bağımlılık problemleri

### Faz 2 — Risk-Sıfır İyileştirme Önerileri

Ölçüm sonuçlarına göre, **sadece aşağıdaki güvenli kategorilerden** öneriler sunacağım:

| Kategori | Risk | Örnek |
|---|---|---|
| **Image optimization** | Sıfır | `loading="lazy"`, `decoding="async"`, boyut attribute'ları, `fetchpriority` |
| **Code splitting (yeni lazy)** | Çok düşük | Henüz lazy olmayan ağır component'ları React.lazy ile bölmek |
| **Preload/Prefetch hint'leri** | Sıfır | Critical font/image için `<link rel="preload">` |
| **Memo/useMemo (target spot)** | Düşük | Sadece ölçümde tespit edilen gereksiz re-render'lar |
| **CSS containment** | Sıfır | `contain: layout` ağır listelerde |
| **Font loading** | Sıfır | `font-display: swap`, subset |
| **Will-change temizliği** | Sıfır | Gereksiz `will-change` kullanımları (GPU memory) |

**Yapılmayacaklar** (mevcut çalışanı bozma garantisi):
- ❌ Audio player mantığını değiştirmek (`mem://audio/mobile-playback-logic` korunur)
- ❌ React Query stale time, branding cache stratejisi
- ❌ Routing yapısı, Auth flow
- ❌ Yeni library/dependency eklemek
- ❌ Animation/transition mantığı (`mem://performance/animation-ux` korunur)
- ❌ Theme, i18n, edge function'lar

### Faz 3 — Sunum

Ölçümler bitince size:
1. **Mevcut durum raporu** (somut sayılarla)
2. **Önceliklendirilmiş iyileştirme listesi** (her biri için: tahmini kazanç + risk seviyesi + etkilenen dosyalar)
3. **Her iyileştirmeyi ayrı ayrı onayınıza sunma** — siz onaylamadan kod değişmez

### Doğrulama Stratejisi
Her iyileştirme uygulandıktan sonra aynı metrik tekrar ölçülür → öncesi/sonrası kıyas → regresyon yoksa kabul.

### Bu Plan Onaylanırsa
Default mode'a geçince ilk iş **sadece ölçüm** yapmak (kod değişikliği yok), sonuçları size raporlamak ve **her iyileştirme için ayrı onay** istemek olacak.

