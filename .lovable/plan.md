

## Metadata Bilgilerini Resmin Altına Taşıma

### Problem
Şu an resim ve metadata (konum, süre, stops, dil seçici) yan yana (`flex gap-4`) duruyor. Mobilde resim 128px genişliğinde kalınca metadata'ya az alan kalıyor.

### Çözüm
Satır 682'deki `flex gap-4` layout'u `space-y-3` (dikey yığın) olarak değiştirilecek. Resim mevcut boyutunda kalacak, metadata bilgileri resmin hemen altına geçecek.

### Değişiklik — `src/pages/GuideDetail.tsx` (satır 682-718)

```
Önce:
<div className="flex gap-4">
  <div className="relative w-32 h-32 ...">  {/* image */}
  </div>
  <div className="flex-1 min-w-0 flex flex-col justify-center">
    {/* LiveListeners, location, duration, language */}
  </div>
</div>

Sonra:
<div className="space-y-3">
  <div className="relative w-32 h-32 ...">  {/* image — boyut aynı */}
  </div>
  <div className="flex flex-col gap-1">
    {/* LiveListeners, location, duration, language — artık resmin altında */}
  </div>
</div>
```

- Resim boyutu değişmez
- Köklü tasarım değişikliği yok, sadece layout yönü değişiyor
- Tek dosya, tek bölüm değişikliği

