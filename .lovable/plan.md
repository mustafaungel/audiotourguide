

## MapPin İkonunu Görselin Sağ Üst Köşesine Pin Olarak Taşıma

### Yeni Layout

```text
┌─────────────────────────┐
│ [Kategori]     [📍 pin] │  ← Sol üst: kategori, sağ üst: kırmızı konum pini
│                         │
│      Görsel             │
│                         │
│  Cappadocia, Turkey     │  ← Alt kısım: konum yazısı (mevcut gibi)
└─────────────────────────┘
```

### Değişiklik — `src/pages/GuideDetail.tsx` (satır 695-701)

1. **Sağ üst köşeye MapPin pini ekle** — `absolute top-1.5 right-1.5`, kırmızı/primary daire arka plan içinde küçük MapPin ikonu
2. **Alt kısımdaki konum badge'inden MapPin ikonunu kaldır** — sadece metin kalsın, böylece daha fazla yer olsun

```tsx
{/* Kategori — sol üst (mevcut) */}
<Badge className="absolute top-1.5 left-1.5 ...">
  {guide.category}
</Badge>

{/* Konum pin — sağ üst (yeni) */}
<span className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-primary rounded-full shadow-md">
  <MapPin className="w-3 h-3 text-primary-foreground" fill="currentColor" />
</span>

{/* Konum yazısı — alt kısım (MapPin ikonu kaldırıldı) */}
<span className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium rounded-md px-1.5 py-0.5">
  <span className="break-words">{guide.location}</span>
</span>
```

Pin rengi `bg-primary` ile tema uyumlu olacak, `fill="currentColor"` ile içi dolu pin görünümü sağlanacak. Tek dosya, tek bölüm değişikliği.

