

## Plan: Audio Access UX Premium Upgrade

### Sorunlar
1. **Accordion açılış/kapanış kasması**: Conditional render (`{isExpanded && ...}`) height animasyonu olmadan çalışıyor — açılırken `animate-in` var ama kapanırken anında kayboluyor ve height transition yok.
2. **MiniPlayer çok küçük**: Mobilde `h-10` play butonu, `w-8 h-8` skip butonları, toplam yükseklik ~56px — dokunma alanları dar ve görsel olarak zayıf.
3. **Dokunma geri bildirimi yetersiz**: Sadece `active:scale-[0.97]` var, renk/gölge değişimi yok. Kullanıcılar tıkladıklarını hissetmiyor.
4. **Ucuz/basit hissi**: Flat renkler, derinlik eksikliği, kartların arasında hiyerarşi yok, gölge ve gradient kullanımı minimal.
5. **ExpandedPlayer kapanış animasyonu yok**: `if (!open) return null` ile anında unmount.

### Yapılacaklar

**1. `src/components/MultiTabAudioPlayer.tsx` — Accordion Animasyonu**
- `closingGuideId` state ekle — kapanırken hemen kaldırmak yerine fade-out + slide-up animasyonu uygula
- `onAnimationEnd` ile DOM'dan kaldır
- Açılışta `animate-in slide-in-from-top-2` korunsun, kapanışta `animate-out fade-out slide-out-to-top-2` eklensin
- Pill butonlarına dokunma geri bildirimi: `active:bg-primary/80` (açıkken), `active:bg-muted` (kapalıyken), `active:shadow-inner` efekti

**2. `src/components/MiniPlayer.tsx` — Boyut ve Premium His**
- Play butonunu `w-12 h-12` yap (şu an `w-10 h-10`)
- Play ikonunu `w-5 h-5` yap (şu an `w-4.5`)
- Skip butonlarını `w-9 h-9` yap (şu an `w-8 h-8`), ikonları `w-4 h-4`
- Thumbnail'i `w-12 h-12` yap (şu an `w-10 h-10`)
- Bar yüksekliğini artır: `py-2` → `py-3`
- Progress bar'ı `h-[2px]` → `h-[3px]` yap, gradient ekle
- `backdrop-blur-2xl` → `bg-background/95` (performans iyileştirmesi)
- Play butonuna `shadow-lg shadow-primary/25` ekle
- Genel yükseklik ~72px olacak

**3. `src/components/ChapterList.tsx` — Premium Dokunma Geri Bildirimi**
- Chapter kartlarına dokunma efekti: `active:bg-primary/15 active:shadow-inner` (şu an sadece scale)
- Aktif chapter'daki `backdrop-blur-sm` kaldır (performans)
- Aktif chapter'a hafif gradient arka plan: `bg-gradient-to-r from-primary/10 to-primary/5`
- Waveform dekorasyonlarına `animate-pulse` ekle (aktif chapter için)
- Chapter badge'e hover glow: `shadow-sm shadow-primary/20`

**4. `src/components/ExpandedPlayer.tsx` — Kapanış Animasyonu**
- İki fazlı mount/unmount: `shouldRender` + `isVisible` state
- Açılış: mount → rAF → `isVisible=true` → `translate-y-0 opacity-100`
- Kapanış: `isVisible=false` → `translate-y-full opacity-0` → 300ms sonra `shouldRender=false`
- CSS transition kullan: `transition-all duration-300 ease-out`

**5. `src/pages/AudioAccess.tsx` — Performans & Premium His**
- Navbar: `backdrop-blur-2xl bg-background/80` → `bg-background/95 shadow-sm` (blur kaldır)
- Pill butonlarına dokunma ripple efekti için `active:ring-2 active:ring-primary/20` ekle
- Review butonuna `shadow-sm hover:shadow-md` derinlik ekle

**6. `src/index.css` — Yeni Utility**
- `animate-out` keyframe tanımları ekle (fade-out, slide-out-to-top)
- `active:shadow-inner` için utility tanım (henüz yoksa)

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MultiTabAudioPlayer.tsx` | Accordion kapanış animasyonu, dokunma efektleri |
| `src/components/MiniPlayer.tsx` | Boyut büyütme, premium gölgeler, blur kaldır |
| `src/components/ChapterList.tsx` | Dokunma geri bildirimi, blur kaldır, gradient |
| `src/components/ExpandedPlayer.tsx` | İki fazlı kapanış animasyonu |
| `src/pages/AudioAccess.tsx` | Navbar blur kaldır, dokunma efektleri |
| `tailwind.config.ts` | `animate-out` keyframe/animation tanımları |

