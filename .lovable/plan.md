

## Plan: Animasyon Kalitesini Artır (Performanslı)

### Sorunlar
1. **BottomSheet**: `backdrop-filter: blur(20px/40px)` mobilde her karede GPU'yu zorluyor. `height` animasyonu layout reflow tetikliyor. Touch handler'da 4 ayrı `setState` her frame'de re-render yapıyor.
2. **Dil seçimi**: `max-height` + `hidden` geçişi ani, smooth değil — `hidden` anında display:none yapar, animasyon olmaz.

### Çözümler

#### 1. BottomSheet Performans (`src/components/ui/bottom-sheet.tsx`)

**Blur kaldır:**
- Backdrop: `backdrop-filter: blur(20px)` → kaldır, `rgba(0,0,0,0.5)` yeterli
- Sheet: `backdrop-filter: blur(40px) saturate(180%)` → kaldır, `bg-background` opak kullan

**Height → Transform:**
- Sheet yüksekliğini sabit `95vh` yap
- Snap geçişlerini `translateY` ile: kapalı=`100%`, half=`35vh`, full=`0`
- `height` transition kaldır — sadece `transform` animate et (GPU-accelerated)

**Touch handler ref'e taşı:**
- `startY`, `currentY`, `velocity`, `lastMoveTime` → `useRef`
- Sürükleme sırasında `sheetRef.current.style.transform` ile doğrudan DOM güncelle (setState yok, re-render yok)
- `requestAnimationFrame` ile throttle

**Backdrop transition:**
- `opacity 0.35s ease` — smooth fade

#### 2. Dil Seçimi Animasyonu (`src/components/GuideLanguageSelector.tsx`)

**`hidden` yerine `opacity + scale + max-height` animasyonu:**
- Collapsed modda seçili olmayan butonlara: `opacity-0 scale-95 max-h-0 overflow-hidden m-0 p-0 border-0` + `transition-all duration-300`
- Açık modda: `opacity-100 scale-100 max-h-[52px]`
- Seçili buton `gridColumn` ile sütun pozisyonunu korur (mevcut mantık kalır)
- Container `max-height` animasyonu da kalır ama artık içerideki butonlar da smooth olarak küçülür

### Etkilenen Dosyalar
- `src/components/ui/bottom-sheet.tsx` — blur kaldır, height→transform, touch ref optimizasyonu
- `src/components/GuideLanguageSelector.tsx` — hidden→animated collapse

### Sonuç
- Drawer açılıp kapanırken 60fps smooth transform animasyonu
- Blur yükü sıfır
- Touch sürükleme kasma yok (ref-based, rAF throttled)
- Dil seçimi açılıp kapanırken butonlar smooth fade+scale ile görünür/kaybolur

