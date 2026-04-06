

## Plan: English Labels + Move Linked Guides & QR into Guide Information

### Changes — `src/components/AdminGuideEditForm.tsx`

**1. Rename Turkish section labels to English:**
- `Temel Bilgiler` → `Basic Info`
- `Açıklama & Öne Çıkarma` → `Description & Featured`
- `Görseller` → `Images`

**2. Move Linked Audio Guides inside Guide Information card as collapsible section 5:**
- Remove standalone `<GuideCollectionManager>` from the grid (line 634-638)
- Add a new collapsible section after Images, rendering `<GuideCollectionManager>` inline (without its own Card wrapper)
- Label: `Linked Guides`
- Default closed

**3. Move QR Code & Sharing inside Guide Information card as collapsible section 6:**
- Remove standalone `<Collapsible><Card>` block at bottom (lines 641-723)
- Add a new collapsible section after Linked Guides with existing QR content
- Label: `QR Code & Sharing`
- Default closed

**4. GuideCollectionManager needs a "headless" mode:**
- Currently wraps itself in `<Card><CardHeader>...`. We need to skip that when embedded.
- Add optional `embedded?: boolean` prop — when true, render only `<div>` with inner content (no Card/CardHeader)

### Result structure inside Guide Information card:

```
▼ Basic Info (open)
▶ Description & Featured
▶ URL & Slug
▶ Images
▶ Linked Guides
▶ QR Code & Sharing
[Update Guide]
```

### Files affected

| File | Change |
|------|--------|
| `src/components/AdminGuideEditForm.tsx` | English labels, move Linked Guides + QR into Guide Info card |
| `src/components/GuideCollectionManager.tsx` | Add `embedded` prop to skip Card wrapper |

