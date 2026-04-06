

## Plan: Admin Content Management — 3 Kritik Düzeltme

### Sorun 1: Düzenleme butonu çalışmıyor
`AdminGuideOrderManager` `admin-edit-guide` event'i dispatch ediyor ama **hiçbir yerde dinlenmiyor**. `AdminPanel.tsx` sadece `admin-tab-change` event'ini dinliyor. `AdminGuideEditForm` ise guide seçimini `sessionStorage('editingGuide')` üzerinden okuyor.

**Düzeltme** — `AdminPanel.tsx`'e `admin-edit-guide` event listener ekle:
```tsx
useEffect(() => {
  const handleEditGuide = (event: CustomEvent) => {
    const { guideId } = event.detail;
    sessionStorage.setItem('editingGuide', JSON.stringify({ id: guideId }));
    setActiveTab('edit-guide');
  };
  window.addEventListener('admin-edit-guide', handleEditGuide as EventListener);
  return () => window.removeEventListener('admin-edit-guide', handleEditGuide as EventListener);
}, []);
```

### Sorun 2: Önizleme linki yanlış URL açıyor
`AdminGuideOrderManager` → `handlePreview` → `/guides/${guide.slug}` açıyor ama React Router'daki route `/guide/:slug` (tekil). Yanlış URL 404 veriyor.

**Düzeltme** — `AdminGuideOrderManager.tsx` satır 76:
```tsx
// Eski:
window.open(`/guides/${guide.slug}`, '_blank');
// Yeni:
window.open(`/guide/${guide.slug}`, '_blank');
```

### Sorun 3: Sıralama ana sayfaya yansımıyor
Veritabanında tüm guide'ların `display_order` değeri `0`. Admin sıralama değiştirip kaydettiğinde DB güncelleniyor ve cache temizleniyor, ancak kullanıcı zaten admin sayfasında — ana sayfaya gittiğinde FeaturedGuides zaten taze veri çekiyor. Sorun muhtemelen `display_order` migration'ının henüz uygulanmamış olmasıydı. Şu an DB'de sütun mevcut ve sorgular doğru. Mevcut tüm guide'ların `display_order`'ını `created_at` sırasına göre güncelleyen bir init script ekleyelim — böylece ilk kaydetmeden önce de anlamlı bir sıralama olur.

**Düzeltme** — `AdminGuideOrderManager.tsx` → `fetchGuides` sonunda, eğer tüm `display_order` değerleri 0 ise otomatik olarak index'e göre güncelle:
```tsx
// Tüm display_order = 0 ise, ilk sıralama ata
if (data && data.length > 1 && data.every(g => g.display_order === 0)) {
  const updates = data.map((g, i) =>
    supabase.from('audio_guides').update({ display_order: i }).eq('id', g.id)
  );
  await Promise.all(updates);
}
```

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/pages/AdminPanel.tsx` | `admin-edit-guide` event listener ekle |
| `src/components/AdminGuideOrderManager.tsx` | Preview URL düzelt (`/guide/`), ilk sıralama ataması |

### Dokunulmayacak
- AudioAccess linkleri (`/access/:guideId`) — hiçbir değişiklik yapılmayacak
- Mevcut guide detay rotası (`/guide/:slug`) — olduğu gibi kalacak

