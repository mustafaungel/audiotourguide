

## Expanded Player Script — 3D Premium Okuma Tasarımı

### Değişiklik — `src/components/ExpandedPlayer.tsx` (ScriptReadingView)

**1. İlk Kelime Vurgusu (Drop Cap → Drop Word)**
- Her paragrafın **ilk kelimesi** (ilk harf değil) ayrıştırılacak
- İlk kelime: `text-[1.6rem]`, `font-black`, `uppercase`, `tracking-wide`
- 3D efekti: `text-shadow` ile derinlik hissi — `2px 2px 4px rgba(0,0,0,0.4)` + hafif `text-primary` glow
- Geri kalan metin normal akışta devam eder (inline, aynı satırda)

**2. Paragraf Kartları — 3D Derinlik**
- Her paragraf yarı-saydam glassmorphism kart içinde: `bg-white/5 dark:bg-white/8`, `backdrop-blur-sm`
- `rounded-xl`, `border border-white/10`
- 3D gölge: `shadow-[0_4px_20px_rgba(0,0,0,0.3)]` — kartlar yüzeyden yükselmiş hissi
- Hover/touch efekti yok (okuma modunda dikkat dağıtmasın)

**3. Divider İyileştirmesi**
- `· · ·` yerine ince gradient çizgi: `bg-gradient-to-r from-transparent via-primary/30 to-transparent`
- `h-px` ince çizgi, paragraf kartları arasında zarif geçiş

**4. Tipografi**
- Gövde metin: `text-[17px]`, `font-normal` (light değil — okunabilirlik), `leading-[1.9]`
- Renk: `text-foreground/90` — biraz daha güçlü kontrast
- `text-shadow: 0 1px 3px rgba(0,0,0,0.15)` — tüm metinde hafif derinlik

**5. Padding**
- Kart iç padding: `p-5`
- Kartlar arası boşluk: `gap-5` (flex column ile)

Tek dosya: `src/components/ExpandedPlayer.tsx`

