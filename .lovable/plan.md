

## Plan: Bottom Sheet Görsel İyileştirme ve Performans

### Mevcut Durum
Bottom sheet açıldığında içeride düz bir `NewSectionAudioPlayer` (ChapterList kartı) render ediliyor. Görsel olarak sade, sheet'in kendisi ile içerik arasında tasarım uyumu yok. Ayrıca her tıklamada section verisi yeniden yüklenebiliyor.

### Değişiklikler

#### 1. `src/components/ui/bottom-sheet.tsx` — Görsel İyileştirme
- Drag handle'ı daha belirgin yap: `w-10 h-1` → `w-12 h-1.5`, renk `bg-muted-foreground/30`
- Header'a alt çizgi (separator) ekle: `border-b border-border/30`
- Kapatma butonunu daha belirgin yap: `bg-muted/50 rounded-full p-2`
- Sheet arka planını güçlendir: `bg-background/95` (daha opak, daha okunaklı)
- Açılış animasyonunu GPU-optimized yap: `will-change: transform` ekle
- Bouncy spring animasyonunu hafiflet (kasma riski): `cubic-bezier(0.25, 1, 0.5, 1)` (daha doğal, daha az CPU)

#### 2. `src/components/MultiTabAudioPlayer.tsx` — Performans
- Bottom sheet `open` olmadığında `NewSectionAudioPlayer`'ı render etme (lazy render)
- `selectedLinkedGuide` değiştiğinde section verisi zaten cache'de ise tekrar fetch etme (mevcut `ensureGuideSections` zaten bunu yapıyor, sadece sheet içi render'ı optimize et)
- Sheet content'i `React.memo` veya conditional render ile sararak gereksiz re-render önle

#### 3. `src/components/ChapterList.tsx` — Sheet İçi Görsel Uyum
- Sheet içinde açıldığında Card'ın border ve shadow'unu kaldır (sheet zaten container): Card'a `border-0 shadow-none bg-transparent` uygula (sheet context'inde)
- Bu sayede sheet içinde çift çerçeve görünümü olmaz, daha temiz bir görünüm sağlanır

### Etkilenen Dosyalar
- `src/components/ui/bottom-sheet.tsx` — görsel polish + animasyon optimizasyonu
- `src/components/MultiTabAudioPlayer.tsx` — lazy render + performans
- `src/components/ChapterList.tsx` — isteğe bağlı `variant` prop ile sheet içi stil

### Performans Garantisi
- `will-change: transform` ile GPU compositing
- Daha hafif animasyon eğrisi (bouncy → smooth)
- Sheet kapalıyken içerik render edilmez
- `overscrollBehavior: contain` zaten mevcut

