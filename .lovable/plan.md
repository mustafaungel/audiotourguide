

## Sorun Tespiti — "Test" Butonu Sayfa Açmıyor

### Nedeni
Admin panelinde "Test" butonu `openMapsLink(url)` çağırıyor, bu fonksiyon desktop'ta `window.open(url, '_blank', 'noopener,noreferrer')` ile yeni sekme açmaya çalışıyor. **Sorun**: Lovable preview ortamı bir iframe içinde çalışıyor ve iframe `sandbox` attribute'u nedeniyle `window.open` çağrıları sıklıkla **popup blocker** tarafından engelleniyor veya boş bir sekme açılıp orada "Bu sayfa görüntülenemiyor" gösteriliyor.

Ayrıca yapıştırılan URL çok uzun (`?entry=ttu&g_ep=...` parametreleri ile) ve bazen Google Maps bu uzun parametrelerle doğrudan açılışta sorun çıkarabiliyor — ama esas sorun iframe popup engelleme.

### Çözüm — "Test" Butonunu Anchor (`<a>`) Olarak Yap
`window.open` yerine doğrudan `<a href={url} target="_blank" rel="noopener noreferrer">` kullanmak en güvenli yöntem. Tarayıcı bunu kullanıcı eylemine bağlı gerçek bir tıklama olarak gördüğü için iframe sandbox engellemesi devre dışı kalır ve yeni sekme sorunsuz açılır.

Ek olarak, URL'yi daha temiz hale getirmek için **link normalizer** ekleyelim:
- `?entry=ttu&g_ep=...` gibi gereksiz tracking parametrelerini temizle
- Sonuç: `https://www.google.com/maps/place/...@coords/data=...` (temiz, kısa, her yerde çalışır)

### Değişiklikler

**1. `src/lib/maps-utils.ts`** — Yeni helper:
```ts
export function normalizeMapsUrl(url: string): string {
  try {
    const u = new URL(url);
    // Strip tracking params
    ['entry', 'g_ep', 'shorturl', 'ved'].forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}
```

Ve `openMapsLink` desktop yolunda: önce `normalizeMapsUrl` uygula.

**2. `src/components/AudioGuideSectionManager.tsx`** — "Test" butonunu Button'dan `<a>` etiketine dönüştür (button styling korunur, `asChild` veya direkt anchor):

```tsx
{section.maps_url && (
  <a
    href={section.maps_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 px-3 h-9 rounded-md border bg-background hover:bg-muted text-sm"
  >
    <ExternalLink className="h-4 w-4" />
    Test
  </a>
)}
```

Bu sayede admin "Test" tıklayınca link doğrudan yeni sekmede sorunsuz açılır (preview iframe içindeyken bile). Kullanıcı tarafındaki section pin (ChapterList) `openMapsLink` kullanmaya devam eder — orada zaten gerçek tarayıcıda (preview iframe değil) çalışacağı için iOS/Android native deneyimi korunur.

**3. Kaydetme sırasında URL temizleme** — `updateSection` çağrılırken `maps_url`'i `normalizeMapsUrl()` ile temizle ki database'e zaten temiz URL kaydedilsin. Bu hem son kullanıcı tarafında hem her yerde daha güvenilir olur.

### Test Akışı
1. Admin panelde Maps linki yapıştır → onBlur → URL otomatik temizlenir, kaydedilir
2. "Test" butonu → yeni sekmede Google Maps açılır (popup engeli yok çünkü artık `<a target="_blank">`)
3. Kullanıcı tarafında section pin tıklama → mobile'da native Maps app, desktop'ta yeni sekme

### Dosya Değişiklikleri (2)
1. `src/lib/maps-utils.ts` — `normalizeMapsUrl()` helper ekle, `openMapsLink` içinde kullan
2. `src/components/AudioGuideSectionManager.tsx` — "Test" butonu `<a>` tag'e dönüştür, `updateSection` çağrısında `normalizeMapsUrl()` uygula

