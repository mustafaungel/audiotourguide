

## Plan: Admin Content Yönetimi İyileştirmesi

### Sorunlar

**1. Sıralama kaydedilince ana sayfa güncellenmiyor**
`Guides.tsx` sayfası `localStorage` cache kullanıyor (satır 16-24, 58). Sıralama değiştiğinde eski cache hâlâ gösteriliyor. Ayrıca FeaturedGuides de sayfa yenilenmeden eski veriyi tutuyor.

**2. AdminGuideOrderManager çok basit — düzenleme, dil bilgisi ve action butonları eksik**
Şu an sadece başlık + konum + durum badge gösteriyor. Diller, section sayısı, hızlı action butonları (edit, preview, publish/hide toggle) yok.

### Çözüm

#### A. Cache invalidation — `Guides.tsx`

Sıralama kaydedildiğinde localStorage cache temizlenecek. `AdminGuideOrderManager.handleSave` sonunda:
```tsx
localStorage.removeItem('guides_list_cache');
```

#### B. AdminGuideOrderManager → Zenginleştirilmiş kompakt liste

Her satıra eklenmesi gerekenler:
- **Dil badge'leri**: `guide_sections` tablosundan her guide'ın mevcut dil kodlarını çek, küçük badge'ler olarak göster (EN, ES, ZH...)
- **Section sayısı**: Her dilde kaç section var
- **Hızlı action butonları** (satır sonunda, dropdown değil — inline icon butonlar):
  - **Edit** (kalem ikonu) → `admin-tab-change` event ile edit sekmesine yönlendir
  - **Preview** (göz ikonu) → guide'ı yeni sekmede aç
  - **Publish/Hide toggle** (göz/gizle ikonu) → `is_published` durumunu toggle et
- **Durum göstergesi iyileştirmesi**: Pending (onay bekleyen) durumu da badge olarak gösterilecek

Sorgu genişletilecek — `languages` sütunu zaten `audio_guides`'da var, ek sorguya gerek yok:
```tsx
.select('id, title, location, is_published, is_approved, price_usd, display_order, languages, slug, master_access_code')
```

#### C. Kompakt satır tasarımı (dropdown yok)

```text
⠿  1. Cappadocia Discover  Istanbul  EN ES IT JA  ● Live  $4.99  [✏️] [👁] [🔒]
```

Tüm butonlar küçük icon-only butonlar, tek satırda sığacak şekilde. Mobilde dil badge'leri gizlenebilir.

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminGuideOrderManager.tsx` | Sorgu genişlet, dil badge'leri ekle, action butonları ekle, cache temizleme |
| `src/pages/Guides.tsx` | Değişiklik yok (cache AdminGuideOrderManager'dan temizlenecek) |

### Teknik Detaylar
- `languages` array'i zaten `audio_guides` tablosunda var — ek DB sorgusu gerekmez
- Action butonları `window.dispatchEvent(new CustomEvent('admin-tab-change'))` ile edit sekmesine yönlendirir
- Publish/hide toggle inline olarak `supabase.update` yapıp listeyi günceller
- `localStorage.removeItem('guides_list_cache')` ile Guides sayfasının eski veriyi göstermesi önlenir

