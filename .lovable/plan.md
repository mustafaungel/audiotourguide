

## Expanded Player — Dark/Light Tema Ayrımı ve Tam Ekran Kullanımı

### Sorunlar (ekran görüntüsünden)
1. **Arka plan görseli ekranı daraltıyor** — blurred image + overlay katmanı gereksiz alan kaplıyor ve script alanını sıkıştırıyor
2. **Dark/Light tema ayrımı yok** — kart ve metin renkleri her iki temada aynı görünüyor, light modda okunabilirlik düşük

### Değişiklikler — `src/components/ExpandedPlayer.tsx`

**1. Arka Plan Görseli Kaldırılacak (Script Varsa)**
- Script text varken blurred background image render edilmeyecek — sadece düz `bg-background` kullanılacak
- Bu sayede ekranın tamamı script için kullanılır, görsel alan kaybı sıfır
- Script yoksa mevcut blurred image veya cover art gösterilmeye devam eder

**2. Dark/Light Tema Ayrımlı Kart Tasarımı**
- **Dark mod**: `bg-white/[0.06]`, `border-white/[0.08]`, `shadow-[0_4px_24px_rgba(0,0,0,0.4)]`
- **Light mod**: `bg-black/[0.04]`, `border-black/[0.08]`, `shadow-[0_2px_12px_rgba(0,0,0,0.08)]`
- Tailwind dark variant ile ayrım: `dark:bg-white/[0.06] bg-black/[0.04]`

**3. Metin Renkleri Tema Duyarlı**
- Gövde metin: `text-foreground/85 dark:text-foreground/90`
- İlk kelime (drop word): `text-foreground dark:text-foreground` (her iki temada tam kontrast)
- Text shadow: Dark modda `rgba(0,0,0,0.3)`, light modda `rgba(0,0,0,0.05)` — inline style ile
- İlk kelime shadow: Dark modda mevcut 3D efekt, light modda daha hafif gölge

**4. Gradient Fade Düzeltmesi**
- Üst/alt fade: `from-background/80` → tema ile uyumlu, arka plan düz olduğu için daha güçlü fade

**5. Overlay Katmanı**
- Script varken overlay tamamen kaldırılacak (arka plan görseli zaten yok)
- Script yokken mevcut overlay korunur

### Teknik Detay
- Tek dosya: `src/components/ExpandedPlayer.tsx`
- Background image render koşulu: `{imageUrl && !scriptText && (...)}`
- Kart class: `cn("rounded-xl p-5 backdrop-blur-sm", "bg-black/[0.04] border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.08)]", "dark:bg-white/[0.06] dark:border-white/[0.08] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]")`

