

## Expanded Player Script Görünümü — Temiz Okuma Modu

### Sorun
Mevcut script görünümü kitap temalı (amber arka plan, serif font, justify hizalama, aktif/pasif paragraf ayrımı, otomatik kaydırma). Alan daraltılmış (`maxWidth: 85%`, `px-6`). Otomatik geçiş ve paragraf takibi karmaşıklık ekliyor.

### Yeni Yaklaşım — Tüm Paragraflar Eşit, Manuel Kaydırma

Kullanıcının istediği:
- Otomatik kaydırma ve aktif/pasif paragraf ayrımı **yok**
- Tüm paragraflar **eşit şekilde okunabilir** (hepsi "aktif" gibi)
- Kullanıcı **kendi istediğinde** kaydırır
- Temiz, modern, tam genişlik tasarım
- Her cihazda uyumlu

### Değişiklikler — `src/components/ExpandedPlayer.tsx`

**ScriptLyricsView bileşeni (satır 14-207) tamamen yeniden yazılacak:**

1. **Kaldırılacaklar:**
   - Otomatik kaydırma sistemi (auto-scroll, RAF animasyonu, userScrolling tracking)
   - `activeIdx` / paragraf zamanlama hesaplama (`buildTimings`)
   - Aktif/pasif paragraf renk/boyut farkları
   - Amber kitap arka planı, border-left, highlighter efekti
   - Paragraf counter (`§ 1/8`)
   - Gradient fade'ler (üst/alt amber)
   - Serif font (`Lora`, `Playfair Display`)

2. **Yeni tasarım:**
   - **Arka plan**: Tamamen şeffaf (blurred image zaten arkada var)
   - **Font**: Sans-serif sistem fontu, `text-[16px]`, `font-normal`, `leading-[1.85]`
   - **Renk**: `text-white/90` (dark üzerinde rahat okunur, arka plan blur zaten koyu)
   - **Hizalama**: `text-left` — doğal okuma akışı
   - **Tam genişlik**: `px-5` padding, `maxWidth` kısıtlaması yok
   - **Paragraf arası**: `mb-5` — tutarlı, rahat boşluk
   - **Metin temizleme**: Fazla boşlukları temizle, çok kısa paragrafları birleştir (< 30 char)
   - **Gradient fade**: Üst ve alt şeffaf-siyah fade (arka planla uyumlu)

3. **Script container** (satır 404): `px-6 py-4` → `px-0 py-2` — alan genişler

### Sonuç
Basit, temiz, tam genişlik bir scroll-to-read deneyimi. Tüm metin eşit derecede okunabilir, kullanıcı kendi hızında kaydırır. Spotify lyrics yerine e-reader tarzı ama modern sans-serif ile.

