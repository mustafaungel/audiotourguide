

## Plan: Dil Seçimi — Sütun Pozisyonu Korunsun, Boşluk Olmasın

### Sorun
Şu anki yaklaşımda seçili buton 2. satırdaysa, üstündeki satırdaki `invisible` butonlar boş alan yaratıyor. Kullanıcı seçili butonun sol/sağ sütun pozisyonunu korumasını ama gereksiz boş satır olmamasını istiyor.

### Çözüm
Collapsed modda:
- Seçili olmayan tüm butonlar `hidden` (display:none) — yer kaplamaz
- Seçili butona `grid-column` style ile orijinal sütunu zorla (index % 2 === 0 → sol, index % 2 === 1 → sağ)
- Container max-height = tek satır yüksekliği (52px)

### Değişiklik — `src/components/GuideLanguageSelector.tsx`

**1. Gizleme mantığı:** `invisible` → `hidden` (sadece collapsed modda, seçili olmayanlara)

**2. Seçili butona explicit grid-column:**
```tsx
style={{ gridColumn: collapsed ? (selectedIndex % 2) + 1 : undefined }}
```

**3. Max-height hesabı basitleşir:**
- Collapsed: `52px` (tek satır, her zaman)
- Açık: mevcut hesaplama aynı kalır

### Sonuç
- Seçili buton solda idiyse solda, sağda idiyse sağda kalır
- Üstte boş satır olmaz — container tek satıra daralır
- İçerik yukarı kayar

### Etkilenen Dosya
- `src/components/GuideLanguageSelector.tsx` — ~5 satır değişiklik

