

## Expanded Player Script — Crystal Glass Arka Plan

### Fikir
Script alanı şu an düz `bg-background` — hiçbir hissiyat yok. Çözüm: Rehberin kapak görselini script arkasında **çok hafif blurlu** göstermek. Ama `backdrop-blur` kullanmak yerine (her kart için GPU yükü), **tek bir sabit blurlu arka plan katmanı** + üzerine yarı-saydam overlay. Performans sıfır etki.

### Yaklaşım — Sabit Blurlu Arka Plan (GPU-friendly)

**1. Arka plan görseli — script varken de göster**
- Şu an `imageUrl && !scriptText` koşulu var → bunu `imageUrl` olarak değiştir (script varken de göster)
- Blur: `blur(40px)` (daha yoğun, metin okunabilirliği korunur)
- Saturation: `saturate(1.2)` — hafif renk canlılığı
- Opacity: Dark modda `0.25`, light modda `0.15` — çok hafif ama hissedilir
- `scale-110` ile kenar boşlukları kapatılır

**2. Overlay katmanı — tema duyarlı**
- Script varken daha güçlü overlay: `bg-background/75 dark:bg-background/70`
- Bu sayede metin okunabilirliği korunur ama arkada hafif renk/ışık hissedilir

**3. Kart glassmorphism güçlendir**
- Kartlardaki `backdrop-blur-sm` → `backdrop-blur-md` (biraz daha cam hissi)
- Bu tek katman blur olduğu için performans etkisi minimal

**4. Top/bottom fade — arka planla uyumlu**
- Gradient fade zaten `from-background/80` — arka plandaki blur ile güzel geçiş yapar

### Teknik Detay — Tek Dosya
`src/components/ExpandedPlayer.tsx`:

- Satır 240: `{imageUrl && !scriptText && (` → `{imageUrl && (`
- Satır 248-249: Blur `20px` → `40px`, opacity `0.55` → `0.2`
- Satır 252: Overlay — script varken `bg-background/75`, yokken mevcut `bg-background/55`
- Satır 71: Kart `backdrop-blur-sm` → `backdrop-blur-md`

### Sonuç
Düz beyaz/siyah arka plan yerine, rehberin kapak görselinin çok hafif, bulanık, kristal cam arkasındaymış gibi hissedilen bir arka plan. Kartlar da hafif cam efektiyle üzerinde yüzüyor. Performans etkisi sıfır — tek bir CSS `filter: blur()` katmanı.

