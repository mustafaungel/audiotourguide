

## Plan: Content Management İyileştirmeleri + Performans

### A. Preview butonu → Audio Access sayfasına yönlendirme

Şu an `handlePreview` → `/guide/${slug}` açıyor (son kullanıcı detay sayfası). Bunun yerine `master_access_code` ile audio access sayfasını açmalı.

**Değişiklik** — `AdminGuideOrderManager.tsx`:
- `GuideItem` interface'ine `master_access_code` ekle
- Sorguya `master_access_code` ekle
- `handlePreview`:
  ```tsx
  // Eski: window.open(`/guide/${guide.slug}`, '_blank');
  // Yeni:
  if (guide.master_access_code) {
    window.open(`/access/${guide.id}?access_code=${guide.master_access_code}`, '_blank');
  } else {
    toast.error('Bu guide için erişim kodu yok');
  }
  ```

### B. Bağlı guide'ları ve dil detaylarını göster

Her guide satırında, o guide'a bağlı olan guide'ları küçük badge olarak gösterelim. `guide_collections` tablosundan `linked_guides` verisini çekeceğiz.

**Değişiklik** — `AdminGuideOrderManager.tsx`:
- Bileşen yüklendiğinde `guide_collections` tablosundan tüm koleksiyonları çek
- Her satırda bağlı guide varsa küçük `🔗 2 linked` badge'i göster (tıklanınca tooltip'te bağlı guide isimleri)
- Bağlı guide yoksa hiçbir şey gösterme

### C. Index.tsx sıralama düzeltmesi

Ana sayfa `display_order` yerine `created_at` ile sıralıyor — bu yüzden sıralama admin'de değiştirildiğinde ana sayfada yansımıyor.

**Değişiklik** — `src/pages/Index.tsx` satır 60:
```tsx
// Eski: .order('created_at', { ascending: false })
// Yeni: .order('display_order', { ascending: true })
```

### D. Performans İyileştirmeleri

Admin paneli yavaş çünkü:
1. **Index.tsx** — 6 büyük resim `import` ile eager load ediliyor (`cappadociaImage`, `istanbulImage`, vb.) ama lazy load olmalı
2. **AdminPanel.tsx** — 753 satırlık monolitik bileşen, tüm tab içerikleri her zaman render ediliyor (Tabs yapısı gereği mount oluyor)

**Değişiklikler**:
- `Index.tsx`: Statik resimleri `import` yerine doğrudan path string olarak kullan (bundle'dan çıkar)
- `AdminPanel.tsx`: Create Guide tab'ındaki ağır form state'lerini ayrı bileşene taşıma — bu plan kapsamında **yapmayacağız**, çünkü refactoring riski yüksek. Bunun yerine QueryClient `staleTime` ayarı zaten 5 dk olduğundan Supabase çağrıları cache'leniyor.

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminGuideOrderManager.tsx` | Preview → access URL, bağlı guide badge, `master_access_code` sorguya ekle, `guide_collections` fetch |
| `src/pages/Index.tsx` | `.order('display_order', { ascending: true })` |

### Dokunulmayacak
- AudioAccess linkleri (`/access/:guideId`) — mevcut
- AdminPreview sayfası — ayrı sayfa, mevcut haliyle kalacak

