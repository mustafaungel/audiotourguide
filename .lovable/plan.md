

## Audio Access ve Bağlı Rehber Sayfalarına 3D Derinlik Uygulaması

Mevcut 3D sistemi (card-3d, glass-badge, btn-raised) bu sayfalara henüz uygulanmamış. Fonksiyonlara dokunmadan sadece CSS class'ları eklenecek.

### Değişiklikler

**1. `src/pages/AudioAccess.tsx`**
- Hero'daki rehber görseline çok katmanlı shadow eklenir (`shadow-[0_4px_16px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.08)]`)
- Kategori badge'ine `glass-badge` class'ı eklenir (zaten `backdrop-blur-md` var ama tutarsız — standartlaştırılacak)
- "Leave Feedback" butonuna `btn-raised` efekti eklenir

**2. `src/components/MultiTabAudioPlayer.tsx`**
- Akordeon pill butonlarına çok katmanlı shadow ve `active:shadow-inner` derinlik efekti eklenir
- Aktif (expanded) pill'e `shadow-lg` yerine daha derin 3D shadow verilir

**3. `src/components/ChapterList.tsx`**
- Ana Card'a çok katmanlı shadow eklenir (mevcut `audio-card-glow` korunur, üstüne shadow eklenir)
- Chapter item'lara hover'da hafif shadow yükselmesi eklenir
- Aktif chapter'ın border'ına daha belirgin 3D shadow verilir

**4. `src/components/MiniPlayer.tsx`**
- Play/Pause butonuna `btn-raised` efekti eklenir (mevcut `shadow-lg shadow-primary/25` korunur, active state iyileştirilir)

### Dokunulmayan Alanlar
- Hiçbir fonksiyon, event handler, state veya prop değiştirilmez
- Sadece className string'lerine class eklenir
- `prefers-reduced-motion` ile tüm efektler zaten devre dışı kalıyor (index.css'te mevcut)

5 dosya, sadece className güncellemeleri.

