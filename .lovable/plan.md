

## GuideDetail: Görsel Altına Metadata Taşıma

### Mevcut Durum
Satır 682-718'de görsel ve bilgiler yan yana (`flex gap-4`): sol tarafta 128px kare görsel, sağ tarafta konum, süre, stops ve dil seçici.

### Yeni Tasarım
Görseli tam genişlikte üstte, metadata'yı (konum, süre, stops) hemen altında göster — dikey (stacked) bir layout.

### Değişiklik — `src/pages/GuideDetail.tsx` (satır 682-719)

```
Önce:  <div className="flex gap-4">
         <div className="relative w-32 h-32 ..."> görsel </div>
         <div className="flex-1 ..."> metadata </div>
       </div>

Sonra: <div className="space-y-3">
         <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg">
           görsel (tam genişlik, 16:9 oran)
           <Badge ... /> (sol üst köşe — aynı)
         </div>
         <div className="flex items-center justify-between">
           <div className="space-y-1">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <MapPin .../> Cappadocia, Turkey
             </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <Clock .../> 66 min · 19 stops
             </div>
           </div>
           <div className="flex items-center gap-2">
             <LiveListenersBadge />
             <GuideLanguageSelector />
           </div>
         </div>
       </div>
```

### Detaylar
- Görsel: `w-32 h-32` → `w-full aspect-[16/9]` — tam genişlik, sinematik oran
- Metadata: `text-xs` → `text-sm` — görseldeki referans ile uyumlu, daha okunabilir
- LiveListenersBadge ve dil seçici sağa hizalı — temiz iki sütunlu alt bilgi
- Tek dosya değişikliği

