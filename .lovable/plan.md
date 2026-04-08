

## Plan: MiniPlayer Konumu + Boyut + Performans + Premium His

### Kök Neden: MiniPlayer Konumu Sorunu

Accordion wrapper'da `translate-y-0` / `-translate-y-1` CSS transform kullanılıyor. CSS spesifikasyonuna göre, bir parent element'e `transform` uygulandığında, içindeki `position: fixed` elemanlar viewport yerine o parent'a göre konumlanır. Bu yüzden linked guide sayfasında MiniPlayer accordion içinde kalıyor, ekranın altına yapışmıyor.

### Yapılacaklar

**1. `src/components/NewSectionAudioPlayer.tsx` — MiniPlayer'ı Portal ile Render Et**
- MiniPlayer'ı `createPortal(miniPlayerElement, document.body)` ile render et (zaten import var ama kullanılmıyor)
- Bu sayede MiniPlayer her zaman viewport'un altına sabitlenir, parent transform'lardan etkilenmez
- Aynı şekilde ExpandedPlayer zaten portal kullanıyor olabilir, kontrol edilecek

**2. `src/components/MiniPlayer.tsx` — Boyut Büyütme + Performans**
- Play butonu: `w-12 h-12` → `w-14 h-14`, ikon `w-5 h-5` → `w-6 h-6`
- Skip butonları: `w-9 h-9` → `w-10 h-10`, ikon `w-4 h-4` → `w-5 h-5`
- Thumbnail: `w-12 h-12` → `w-14 h-14`
- Title: `text-sm` → `text-base font-semibold`
- Time: `text-[11px]` → `text-xs`
- Padding: `px-3 py-3` → `px-4 py-3.5`
- Expand butonu: `w-8 h-8` → `w-10 h-10`, ikon `w-4 h-4` → `w-5 h-5`
- Progress bar: `transition-all duration-300` kaldır (saniyede 4x güncelleniyor, gereksiz kasma)
- Shadow: `shadow-[0_-2px_12px_-4px_...]` → `shadow-[0_-4px_20px_-4px_...]` daha belirgin

**3. `src/components/MultiTabAudioPlayer.tsx` — Accordion Performans**
- `translate-y-0` / `-translate-y-1` kaldır — MiniPlayer portal ile çözüldüğü için gerekli değil ama yine de kaldırmak daha temiz
- `max-h-[2000px]` transition'ı → sadece `opacity` transition'ı (layout recalc yok)
- `overflow-hidden` kaldır (MiniPlayer artık portal'da)
- Pill butonları: `active:scale-[0.97]` → `active:scale-[0.95]`, `shadow-md` → `shadow-lg`

**4. `src/pages/AudioAccess.tsx` — Hero Blur Kaldır**
- Satır 698: `blur-2xl` → kaldır, sadece `opacity-20` bırak
- Bu mobil kasmanın en büyük kaynağı

**5. `src/components/ChapterList.tsx` — Dokunma Güçlendir**
- Chapter kartları: `active:scale-[0.97]` → `active:scale-[0.96]`
- Aktif chapter: daha güçlü `active:bg-primary/20`
- Progress bar transition kaldır

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `NewSectionAudioPlayer.tsx` | MiniPlayer'ı `createPortal` ile body'ye taşı |
| `MiniPlayer.tsx` | Boyut büyüt, progress transition kaldır, shadow güçlendir |
| `MultiTabAudioPlayer.tsx` | Transform kaldır, accordion sadece opacity ile |
| `AudioAccess.tsx` | Hero `blur-2xl` kaldır |
| `ChapterList.tsx` | Dokunma efektleri güçlendir, progress transition kaldır |

