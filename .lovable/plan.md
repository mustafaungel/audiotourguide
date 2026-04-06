

## Plan: Dil Seçici — Pozisyon ve Performans Düzeltmesi

### Sorunlar

**1. Collapse pozisyon hatası (satır 125, 139)**
Seçili dil sağ sütundaysa (örn. 中文, index=3 → gridColumn=2), collapse olduğunda sol sütun boş kalıyor, buton sağda tek başına asılı duruyor.

**2. Kasma / jank (satır 140-148)**
Her buton üzerinde `transition-all duration-300` var — opacity, scale, max-height, padding, margin, border hepsi birden animate ediliyor. Çok dilli rehberlerde (8+ dil) bu ciddi frame drop'a neden oluyor.

### Çözüm

#### A. Collapse pozisyonu — `GuideLanguageSelector.tsx`

Collapse modunda `gridColumn` zorlamasını kaldır, bunun yerine seçili butonu `col-span-2` (tam genişlik) yap. Böylece hangi sütunda olursa olsun ortalanmış, tutarlı görünür.

Satır 125'teki `selectedCol` hesabı kaldırılacak. Satır 139'daki `style` kaldırılacak. Yerine:
```tsx
className={cn(
  // ... mevcut sınıflar
  isSelected && collapsed && "col-span-2"
)}
```

#### B. Performans — transition daraltma

`transition-all` yerine sadece `opacity` ve `transform` animate edilecek:
```tsx
"transition-[opacity,transform] duration-200 ease-out"
```

Gizlenen butonlar için `max-h-0 min-h-0 py-0 my-0 border-0` gibi yardımcı class'lar `transition` kapsamından çıkarılacak — bunlar anında uygulanacak, sadece opacity/scale yumuşak geçiş yapacak.

### Etkilenen Dosya
- `src/components/GuideLanguageSelector.tsx` — ~5 satır değişiklik

