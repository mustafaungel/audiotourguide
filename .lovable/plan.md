

## Plan: Ana Sayfadaki Section Header, Search ve Filters Alanını Kaldırma

### Problem
Ekran görüntüsündeki "Explore Audio Guides" başlığı, açıklama metni, arama kutusu ve Filters butonu gereksiz yer kaplıyor. Kullanıcı bunların kaldırılmasını istiyor.

### Değişiklikler (`src/pages/Index.tsx`)

**Kaldırılacaklar (lines ~157-199):**
- "Audio Guides" badge
- "Explore Audio Guides" başlığı
- Açıklama paragrafı
- Search input alanı
- Filters butonu ve Clear butonu
- "Search Results Info" bloğu

**Kalacaklar:**
- Carousel (guide kartları) aynen kalır
- `searchTerm` state ve `filteredGuides` logic'i kaldırılır (artık kullanılmıyor)
- `Search`, `Filter` import'ları temizlenir
- Carousel direkt `guides` datasını kullanır (`filteredGuides` yerine)

### Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/pages/Index.tsx` | Header/search/filter bloğu sil, unused state ve import'ları temizle |

Tek dosya, sadece silme işlemi — fonksiyonalite bozulma riski yok.

