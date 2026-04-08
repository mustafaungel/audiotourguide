

## Plan: ChapterList Audio Guide Temalı Görsel İyileştirme

### Mevcut Durum
ChapterList basit bir liste — düz arka plan, sade numara daireleri, minimal progress bar. Site genelindeki "Ultra-Luxury Audio Guide" temasıyla uyumsuz.

### Değişiklikler (`src/components/ChapterList.tsx`)

#### 1. Kart Başlığı — Audio Kimliği
- "Up Next" başlığının yanına `Headphones` ikonu ekle
- Kart container'a `audio-card-glow` class ve `border-border/30`

#### 2. Chapter Satırları — Premium Görünüm
- Her chapter satırının sol tarafına 3 barlı mini waveform dekorasyonu (CSS-only, `opacity: 0.3`)
- Aktif chapter'ın numarası `bg-gradient-to-br from-primary to-primary/70` gradient
- Aktif olmayan chapter numaralarına `bg-primary/10` tonu (mevcut `bg-muted` yerine)
- Hover'da satıra subtle `bg-primary/5` geçişi

#### 3. Progress Bar — Spotify Tarzı
- Progress bar'ı daha kalın yap (`h-[3px]` → `h-1`)
- Gradient'e glow efekti ekle (`shadow-primary/30`)
- Progress bar'ın ucuna küçük yuvarlak nokta (Spotify tarzı scrubber dot)

#### 4. Aktif Chapter — Öne Çıkarma
- Aktif chapter border'ını `border-primary/40` → `border-primary/50` artır
- Sol kenarda `border-l-2 border-l-primary` accent çizgisi ekle
- Arka planı `bg-primary/15` → `bg-primary/10` hafiflet ve `backdrop-blur-sm` ekle

#### 5. Süre Gösterimi — Badge Formatı
- Süre metnini küçük bir `bg-primary/10 rounded-full px-2` badge içine al

### Dokunulmayacaklar
- Tüm event handler'lar, props, fonksiyonalite aynen kalır
- BottomSheet speed picker aynen kalır
- Haptics, translations aynen kalır

### Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/ChapterList.tsx` | Audio temalı görsel iyileştirmeler (import: Headphones ikonu eklenir) |

