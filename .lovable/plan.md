

## Plan: AudioAccess Performans ve Animasyon Düzeltmeleri

### Tespit Edilen Sorunlar

1. **Accordion kapanış animasyonu yok**: `MultiTabAudioPlayer`'da guide kapatılırken içerik anında kayboluyor — sadece `{isExpanded && ...}` conditional render var, çıkış animasyonu yok.

2. **ExpandedPlayer kapanış animasyonu yok**: `if (!open) return null` ile anında unmount oluyor. Açılırken `animate-in slide-in-from-bottom` var ama kapanırken hiçbir geçiş yok.

3. **`backdrop-blur` kaynaklı kasma**: AudioAccess sayfasında 3 yerde `backdrop-blur` kullanılıyor:
   - Navbar: `backdrop-blur-2xl` (line 675)
   - Hero background: `blur-2xl` (line 698) 
   - ChapterList aktif chapter: `backdrop-blur-sm` (line 207)
   
   Mobilde bu filtreler her frame'de tüm alt pikselleri yeniden işler → frame drop ve kasma.

### Çözümler

**`src/components/ExpandedPlayer.tsx`:**
- `if (!open) return null` yerine BottomSheet benzeri iki fazlı mount/unmount: `rendered` + `visible` state
- Açılış: mount → next frame → `visible=true` → `slide-in-from-bottom + fade-in`
- Kapanış: `visible=false` → `slide-out-to-bottom + fade-out` → `onTransitionEnd` → unmount
- CSS transition kullanılacak (Tailwind animate yerine), böylece hem giriş hem çıkış kontrol edilir

**`src/components/MultiTabAudioPlayer.tsx`:**
- Accordion içeriğine kapanış animasyonu ekle
- Yaklaşım: `selectedGuideId` değiştiğinde eski içeriği hemen kaldırmak yerine, `closingGuideId` state ile fade-out + slide-out animasyonu uygula
- Animasyon bitince (`onAnimationEnd`) eski guide'ı DOM'dan kaldır

**`src/pages/AudioAccess.tsx`:**
- Navbar: `backdrop-blur-2xl` → `bg-background/95` (opak arka plan, blur yok)
- Hero background: `blur-2xl` → `blur-2xl` kalabilir (statik, bir kere render) ama `will-change-transform` zaten var — sorun yok
- Genel olarak animasyonlu overlay'lerdeki blur'ları kaldır

**`src/components/ChapterList.tsx`:**
- Aktif chapter'daki `backdrop-blur-sm` → kaldır (zaten `bg-primary/10` yeterli)

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/ExpandedPlayer.tsx` | İki fazlı mount/unmount ile kapanış animasyonu |
| `src/components/MultiTabAudioPlayer.tsx` | Accordion kapanış animasyonu (fade-out + slide) |
| `src/pages/AudioAccess.tsx` | Navbar backdrop-blur kaldır |
| `src/components/ChapterList.tsx` | Aktif chapter backdrop-blur kaldır |

