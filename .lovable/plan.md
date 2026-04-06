

## Plan: Admin Guide Sıralama Sistemi (Drag & Drop)

### Genel Bakış
Admin panelinin Content Management sekmesinde audio guide'ları sürükle-bırak ile sıralayabilme ve kompakt liste görünümü.

### Veritabanı Değişikliği
`audio_guides` tablosuna `display_order` (integer, default 0) sütunu eklenecek. Ana sayfadaki FeaturedGuides ve Guides sayfası bu sütuna göre sıralayacak.

**Migration:**
```sql
ALTER TABLE audio_guides ADD COLUMN display_order integer NOT NULL DEFAULT 0;
```

### Yeni Bileşen: `AdminGuideOrderManager.tsx`

Kompakt, sürükle-bırak destekli liste:
- Her guide tek satırda: **sıra numarası + drag handle (⠿) + başlık + konum + durum badge + fiyat**
- Dropdown yok — tüm bilgi tek satırda
- `@dnd-kit/core` ve `@dnd-kit/sortable` ile native drag-and-drop
- Sıralama değiştiğinde "Kaydet" butonu aktif olur, toplu güncelleme yapar
- Mobilde de touch-friendly drag handle

```text
┌──────────────────────────────────────────────────────┐
│  Guide Sıralaması                        [Kaydet]    │
├──────────────────────────────────────────────────────┤
│  ⠿  1. Istanbul Historical Tour    Istanbul  ● Live  │
│  ⠿  2. Mix Tour                    Mixed     ● Live  │
│  ⠿  3. Hagia Sophia Guide          Istanbul  ● Live  │
│  ⠿  4. Rome Walking Tour           Rome      ○ Hidden│
└──────────────────────────────────────────────────────┘
```

### Mevcut Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/migrations/new` | `display_order` sütunu ekleme |
| `src/components/AdminGuideOrderManager.tsx` | Yeni — drag-drop sıralama bileşeni |
| `src/pages/AdminPanel.tsx` | Content Management sekmesine OrderManager ekleme |
| `src/components/FeaturedGuides.tsx` | `.order('display_order')` ekleme |
| `src/pages/Guides.tsx` | `.order('display_order')` ekleme |

### Paket Bağımlılığı
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` — React drag-and-drop kütüphanesi

### Kaydetme Mantığı
Sıralama değiştiğinde her guide'ın `display_order` değeri güncellenir. Toplu update tek seferde yapılır:
```tsx
for (const [index, guide] of reorderedGuides.entries()) {
  await supabase.from('audio_guides').update({ display_order: index }).eq('id', guide.id);
}
```

