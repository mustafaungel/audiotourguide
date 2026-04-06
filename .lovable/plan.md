

## Plan: Ana Sayfa Sıralama Düzeltmesi + Content Management Genişletilebilir Satırlar

### Sorun 1: Ana sayfa eski sıralamayı gösteriyor

**Kök neden**: `Index.tsx` (satır 38-39) ve `Guides.tsx` (satır 30-31) sayfa yüklendiğinde `localStorage` cache'ini okuyup ilk state olarak kullanıyor. Admin sıralamayı kaydedince cache temizleniyor ama eğer kullanıcı SPA içinde navigasyon yapıyorsa bileşen yeniden mount olmuyor — eski state kalıyor.

**Düzeltme**: Her iki sayfada cache'i tamamen kaldır. `useState<any[]>([])` ile başla, her mount'ta taze veri çek. Cache mekanizması gereksiz karmaşıklık ekliyor ve sıralama sorununa yol açıyor.

- `src/pages/Index.tsx`: `GUIDES_CACHE_KEY`, `getCachedGuides`, `cachedGuides` referanslarını ve `localStorage.setItem` satırını kaldır
- `src/pages/Guides.tsx`: Aynı cache kaldırma işlemi

### Sorun 2: Content Management'ta genişletilebilir satır detayları

Şu an guide satırlarına tıklanınca hiçbir şey olmuyor — sadece drag handle ve action butonları var. Kullanıcı diller, bağlı guide'lar ve müşteri linklerini göremiyoro.

**Düzeltme**: Her satıra tıklandığında aşağıya doğru açılan bir detay paneli ekle (accordion tarzı). İçeriği:

```
┌─────────────────────────────────────────────────────┐
│ ≡  1  Cappadocia Guide  Göreme  🇺🇸🇹🇷  Live  $4.99  │  ← mevcut satır
├─────────────────────────────────────────────────────┤
│  📋 Diller: 🇺🇸 English, 🇹🇷 Türkçe                  │
│  🔗 Bağlı Guide'lar: Istanbul Guide, Pamukkale..   │
│  🔑 Müşteri Erişim Linki:                          │
│     /access/{id}?access_code={master_access_code}   │  [Kopyala]
│  🌐 Detay Sayfası:                                  │
│     /guide/{slug}                                   │  [Kopyala]
└─────────────────────────────────────────────────────┘
```

**Değişiklik** — `AdminGuideOrderManager.tsx`:
- `SortableGuideRow`'a `expanded` state ekle
- Satır gövdesine (drag handle ve action butonları hariç) tıklanınca toggle
- Açılan panel: dil listesi (bayrak + isim), bağlı guide isimleri, müşteri linki (kopyalama butonu ile), detay sayfası linki
- `guide_sections`'dan dil bilgisini çekmek yerine mevcut `guide.languages` array'ini kullan (zaten mevcut)

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/pages/Index.tsx` | Cache mekanizmasını kaldır |
| `src/pages/Guides.tsx` | Cache mekanizmasını kaldır |
| `src/components/AdminGuideOrderManager.tsx` | Genişletilebilir satır detayları ekle |

### Dokunulmayacak
- `/access/:guideId` rotası ve AudioAccess bileşeni
- `/guide/:slug` rotası ve GuideDetail bileşeni

