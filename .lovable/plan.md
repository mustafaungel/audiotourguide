

## Konum Badge'ini Görselin İçine Taşıma

Konum badge'i şu an görselin üstünde ayrı bir satırda duruyor. Bunu görselin içine (sağ alt köşeye) taşıyacağız — tıpkı kategori badge'inin sol üstte durması gibi.

### Değişiklik — `src/pages/GuideDetail.tsx`

**Satır 683-687:** Konum badge satırını sil (dışarıdan kaldır).

**Satır 691-704:** Görselin içine, kategori badge'inin altına konum badge'i ekle:

```tsx
<div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden shadow-lg">
  <OptimizedImage ... />
  {/* Kategori — sol üst (mevcut) */}
  <Badge className="absolute top-1.5 left-1.5 ...">
    {guide.category}
  </Badge>
  {/* Konum — sol alt (yeni) */}
  <span className="absolute bottom-1.5 left-1.5 right-1.5 inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium rounded-md px-1.5 py-0.5 truncate">
    <MapPin className="w-2.5 h-2.5 shrink-0" />
    <span className="truncate">{guide.location}</span>
  </span>
</div>
```

Konum badge'i görselin sol altına yerleşecek, yarı saydam siyah arka plan ile okunabilirliği korunacak. `truncate` ile uzun konum isimleri taşmayacak.

Tek dosya, tek bölüm değişikliği.

