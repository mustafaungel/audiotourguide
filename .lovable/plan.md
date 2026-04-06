

## Plan: Müşteri Linklerini Düzelt (Production Domain)

### Sorun

`AdminGuideOrderManager.tsx` genişletilmiş paneldeki **müşteri erişim linki** ve **detay sayfası linki** `window.location.origin` kullanıyor — bu da preview/localhost ortamında yanlış URL üretiyor. Müşteriye gönderilen linkler her zaman `https://audiotourguide.app` olmalı.

Admin **önizleme butonu** ise doğru: `window.location.origin` kullanarak admin'in test ortamında kontrol yapmasını sağlıyor.

### Düzeltme — `src/components/AdminGuideOrderManager.tsx`

`buildAccessUrl` ve `getBaseUrl` fonksiyonlarını `url-utils.ts`'den import et ve genişletilmiş paneldeki linkleri düzelt:

| Link | Şu an | Olması gereken |
|------|-------|---------------|
| 🔑 Müşteri Erişim | `${window.location.origin}/access/...` | `buildAccessUrl(id, code, 'public')` → `https://audiotourguide.app/access/...` |
| 🌐 Detay Sayfası | `${window.location.origin}/guide/...` | `${getBaseUrl()}/guide/${slug}` → `https://audiotourguide.app/guide/...` |
| Önizleme butonu | `window.location.origin` (doğru) | Değişiklik yok — admin test ortamı |

Değişiklikler:
1. Import `buildAccessUrl` ve `getBaseUrl` from `@/lib/url-utils`
2. Satır 98-100: `accessLink` → `buildAccessUrl(guide.id, guide.master_access_code!, 'public')`
3. Satır 101: `detailLink` → `` `${getBaseUrl()}/guide/${guide.slug}` ``

### Etkilenen Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminGuideOrderManager.tsx` | Müşteri linklerinde production domain kullan, import ekle |

### Dokunulmayacak
- Preview butonu (satır 90-96) — admin test için `window.location.origin` kalacak
- `AdminQRCodeDropdown.tsx` — zaten `buildAccessUrl` kullanıyor, doğru çalışıyor
- AudioAccess rotası, GuideDetail rotası — değişiklik yok

