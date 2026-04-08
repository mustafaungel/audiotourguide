

## Plan: GuideDetail Sayfasına Audio Guide Teması Uygulama

### Problem
GuideDetail sayfası henüz site genelindeki "Ultra-Luxury Audio Guide" temasıyla güncellenmemiş. Diğer sayfalarda kulaklık ikonları, ses dalgası dekorasyonları ve premium audio hissi varken, bu sayfa düz/generic görünüyor.

### Değişiklikler (`src/pages/GuideDetail.tsx`)

#### 1. Hero Görsel — Audio Overlay
- Görselin alt kenarına waveform barları ekle (GuideCard'daki gibi, `.card-waveform`)
- Kategori badge'ine `Headphones` ikonu ekle
- Başlığın yanına küçük kulaklık ikonu

#### 2. Guide Info Kartı — Premium Audio Hissi
- Kart border'ını `border-border/30` yap, `audio-card-glow` class ekle
- Location/Duration satırına `·` ayracı ile tek satır formatı (GuideCard ile tutarlı)

#### 3. Chapter Listesi — Audio Player Teması
- Her chapter kartına küçük waveform dekorasyonu (sol kenarda 3 bar)
- Chapter numarası dairesini `bg-primary/10` → gradient primary tonuna çevir
- Hover'da kartlara subtle glow efekti (`audio-card-glow`)

#### 4. Sidebar Kartları — Tutarlı Tema
- Purchase kartına `audio-card-glow` class
- Related guides kartlarına kulaklık ikonu
- Linked guides kartlarına waveform dekorasyonu

#### 5. QR Code Bölümü — Premium Dokunuş
- QR code container'a `ring-primary/20` halkası
- Locked state'deki QR ikonu arkasına dekoratif ses dalgası

#### 6. Tab Listesi — Audio Temalı
- Chapters tab'ına küçük `Headphones` ikonu prefix

#### 7. Loading State
- Mevcut skeleton'a waveform animasyonu ekle (zaten AudioGuideLoader var, dokunulmaz)

### Dokunulmayacaklar
- Supabase queries, payment flow, auth logic — sıfır değişiklik
- EmbeddedCheckout, EnhancedAudioPlayer — aynen kalır
- SEO, structured data — aynen kalır

### Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/pages/GuideDetail.tsx` | Audio temalı görsel iyileştirmeler (ikonlar, glow, waveform dekor) |

Tek dosya değişikliği — sadece className ve dekoratif JSX eklemeleri.

