

## Plan: Ultra-Luxury Audio Guide Temalı Site-Geneli Tasarım Yenileme

### Vizyon

Tüm sayfaları Spotify/Apple Music estetiğinde, kulaklık ve ses dalgası motiflerini merkeze alan "premium audio" kimliğine kavuşturmak. Performans bozulmayacak — tüm animasyonlar GPU-hızlandırmalı (`transform`, `opacity`), ek JS kütüphanesi yok.

### Kapsam ve Değişiklikler

---

#### 1. GuideCard — "Vinyl Record" Premium Tasarım
**Dosya:** `src/components/GuideCard.tsx`

- Kartın üst köşesine küçük kulaklık silüeti (SVG inline, import yok) ekle — kartın audio guide olduğunu anında belli eder
- Görselin alt kısmındaki waveform barlarını daha fazla bar (9-11) ve daha ince yaparak premium hissettir
- Hover'da play butonu yerine "kulaklık + ses dalgası" birleşik animasyon — kulaklıktan ses dalgaları yayılır efekti (CSS-only, `::before`/`::after` pseudo elements)
- Fiyat alanına küçük "Premium Audio" etiketini kaldır, sadece fiyat + "Listen" butonu
- Kart border'ını `border-border/30` yaparak daha hafif, cam efekti hissi

#### 2. HeroSection — Kulaklık Silüeti + Ses Dalgası Arka Plan
**Dosya:** `src/components/HeroSection.tsx`

- Hero başlığının arkasına CSS-only büyük kulaklık silüeti (`opacity: 0.03-0.05`) dekoratif element — SVG inline
- CTA butonuna "Play" ikonu yerine "Headphones" ikonu geç
- Dekoratif blur daireleri yerine 3 adet CSS ses dalgası çizgisi ekle (yatay, `opacity: 0.1`, yavaş animasyon)
- Badge'deki Sparkles ikonunu Headphones ile değiştir

#### 3. Navigation — Audio Marka Kimliği
**Dosya:** `src/components/Navigation.tsx`

- "Audio Guides" nav linkinin yanına küçük kulaklık ikonu ekle
- Backdrop-blur'u artır (`backdrop-blur-2xl`)
- Header border'ını daha ince yap (`border-border/30`)

#### 4. Footer — Premium Audio Branding
**Dosya:** `src/components/Footer.tsx`

- Footer arka planına çok hafif ses dalgası pattern (CSS `repeating-linear-gradient`, performans dostu)
- "Audio Tour Guides" yazısının yanına kulaklık ikonu
- Border'ı daha ince ve şık

#### 5. Countries Sayfası — Ülke Kartlarına Audio Teması
**Dosya:** `src/pages/Countries.tsx`

- Ülke kartlarının alt kısmındaki Headphones ikonunu biraz büyüt
- Kart hover'da border'a subtle `primary/20` glow ekle
- Header badge'deki MapPin'i koruyarak yanına küçük ses dalgası dekoratif çizgisi ekle

#### 6. Guides Sayfası — Tutarlı Tema
**Dosya:** `src/pages/Guides.tsx`

- Index sayfasıyla aynı section header ve badge stilini uygula
- Grid layout'u carousel yerine güzel bir masonry-benzeri grid olarak düzenle (CSS grid, JS yok)

#### 7. AudioAccess — iOS Lüks Hissi Artırma
**Dosya:** `src/pages/AudioAccess.tsx`

- Hero bölümündeki guide image'a ince `ring-primary/20` halkası ekle
- Navbar'daki title'a küçük kulaklık ikonu prefix
- Review butonu stilini `bg-primary/5 border-primary/20` yaparak audio temasına uyumlu hale getir

#### 8. Index Ana Sayfa — Bölüm Tutarlılığı
**Dosya:** `src/pages/Index.tsx`

- CTA section'daki gradient'i audio temasına uygun ses dalgası dekoratif pattern ile zenginleştir
- Section aralarına ince horizontal divider yerine ses dalgası çizgisi (CSS-only)

#### 9. CSS Sistemi — Yeni Audio Temalı Utility'ler
**Dosya:** `src/index.css`

- `.audio-card-glow` — hover'da kartlara ince primary glow
- `.audio-hero-silhouette` — kulaklık silüeti arka plan (CSS gradient ile)
- `.audio-wave-decoration` — yatay dekoratif ses dalgası çizgileri (CSS `repeating-linear-gradient`)
- `.audio-premium-badge` — cam efektli premium audio badge stili
- Mevcut `.card-waveform` animasyonunu iyileştir (daha yumuşak, daha lüks)

---

### Performans Garantileri

- **Sıfır yeni JS kütüphanesi** — tüm dekoratif elementler CSS-only
- **GPU-hızlandırmalı animasyonlar** — sadece `transform`, `opacity`, `filter`
- **Lazy dekoratif elementler** — ağır olmayan pseudo-element'ler, extra DOM node minimum
- **Mobilde animasyon azaltma** — `@media (prefers-reduced-motion)` desteği ve mobilde bazı hover animasyonlarını devre dışı bırak
- **Mevcut image optimizasyonu korunur** — OptimizedImage, lazy loading dokunulmaz

### Dokunulmayacak Sistemler

- Supabase queries, auth, payment flow
- Admin panel iç işleyişi (sadece görsel dokunuşlar)
- Audio player fonksiyonalitesi
- SEO, structured data, routing

### Dosya Özeti

| Dosya | Değişiklik Türü |
|-------|----------------|
| `src/components/GuideCard.tsx` | Premium audio temalı yeniden stil |
| `src/components/HeroSection.tsx` | Kulaklık silüeti + ses dalgası dekorasyon |
| `src/components/Navigation.tsx` | Audio marka ikonu, backdrop artırma |
| `src/components/Footer.tsx` | Ses dalgası pattern, premium branding |
| `src/pages/Index.tsx` | CTA ve section dekorasyon |
| `src/pages/Countries.tsx` | Kart glow ve audio teması |
| `src/pages/Guides.tsx` | Tutarlı section header |
| `src/pages/AudioAccess.tsx` | Lüks dokunuşlar, kulaklık prefix |
| `src/index.css` | Yeni audio utility class'ları |

