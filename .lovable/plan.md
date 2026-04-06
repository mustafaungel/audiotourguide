

## Plan: Edit Form'u Kompakt Hale Getirme

### Mevcut Durum
Edit formu 692 satırlık tek bir dikey akış — Guide Information kartı içinde 7+ alan (title, description, location, category, price, featured, slug, images) art arda sıralanıyor ve aşağıya çok uzuyor. QR Code & Sharing kartı da en altta ayrı yer kaplıyor.

### Yaklaşım: Accordion (Collapsible) Bölümler

Mevcut `lg:grid-cols-2` layout'u koruyarak, sol sütundaki Guide Information kartını **4 collapsible bölüme** ayıracağız. İlk bölüm (Temel Bilgiler) varsayılan açık, diğerleri kapalı başlayacak.

```
┌─ Guide Information ────────────────┐  ┌─ Guide Sections ──────┐
│ ▼ Temel Bilgiler (açık)            │  │ AudioGuideSectionMgr  │
│   Title, Location, Category, Price │  │                       │
│ ▶ Açıklama & Öne Çıkarma (kapalı) │  │                       │
│ ▶ URL & Slug (kapalı)             │  └───────────────────────┘
│ ▶ Görseller (kapalı)              │  ┌─ Collections ─────────┐
│                                    │  │ GuideCollectionMgr    │
│ [💾 Update Guide]                  │  └───────────────────────┘
└────────────────────────────────────┘
┌─ QR Code & Sharing ───── (collapsible, kapalı) ──────────────┐
└──────────────────────────────────────────────────────────────-┘
```

### Değişiklikler — `src/components/AdminGuideEditForm.tsx`

1. **Import** `Collapsible, CollapsibleContent, CollapsibleTrigger` from `@/components/ui/collapsible`
2. **Bölüm 1 — Temel Bilgiler** (varsayılan açık): Title, Location, Category, Price
3. **Bölüm 2 — Açıklama & Öne Çıkarma** (kapalı): Description textarea, Featured toggle
4. **Bölüm 3 — URL & Slug** (kapalı): Slug yönetimi
5. **Bölüm 4 — Görseller** (kapalı): ImageUploader
6. **QR Code kartını** da collapsible yap (kapalı başlasın)
7. Hiçbir işlev değişmeyecek — sadece görsel düzen kompaktlaşacak

### Etkilenen Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminGuideEditForm.tsx` | Form alanlarını collapsible bölümlere ayır |

