

## Plan: Dil Seçici — Alt Satır Kayma Düzeltmesi

### Sorun

Collapse modunda gizlenen butonlar CSS grid'den kaldırılmıyor. `opacity-0 max-h-0 min-h-0` ile görsel olarak gizlenseler de, grid hücreleri ve `gap-2` (8px) hâlâ yer kaplıyor. 2. satırdaki bir dil seçildiğinde (한국어, 中文), seçili buton aşağı kayıyor ve `maxHeight: 52px` ile kırpılıyor.

### Çözüm — `GuideLanguageSelector.tsx`

Collapse modunda seçili butonu CSS `order: -1` ile grid'in en başına taşı, gizlenen butonlara `hidden` (display:none) uygula. Böylece grid row hesaplaması tamamen düzelir.

```tsx
// Collapsed + hidden → display:none (grid'den tamamen çıkar)
isHidden && "hidden"

// Collapsed + selected → order first
isSelected && collapsed && "col-span-2 order-first"
```

`max-h-0 min-h-0 py-0 my-0 border-0 overflow-hidden` gibi workaround class'lar kaldırılır çünkü `hidden` zaten yeterli.

`maxHeight` style hesaplaması da sadeleşir: collapsed durumda `rowHeight`, genişlemiş durumda hesaplanan yükseklik.

### Etkilenen Dosya
- `src/components/GuideLanguageSelector.tsx` — ~3 satır değişiklik

### Beklenen Sonuç
- Hangi dil seçilirse seçilsin, collapse durumunda buton her zaman grid'in en üstünde, tam genişlikte ve kayma olmadan görünür

