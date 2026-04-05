

## Plan: AudioAccess Sayfası — iOS-Vari Tam Yeniden Tasarım (Mobil Öncelikli)

### Mevcut Durum Analizi (Mobil Ekran Görüntülerinden)

Mevcut sayfa klasik bir Card layout kullanıyor — büyük resim, altında başlık/açıklama, dil seçici, tab bar (linked guides), chapter list, review formu. Sorunlar:
- Görsel hiyerarşi zayıf — her şey aynı ağırlıkta
- Tab bar mobilde çok yer kaplıyor (grid-cols-1)
- "Leave a Review" başlığı iki kez tekrar ediyor (h3 + CardTitle)
- Chapter list'teki butonlar küçük ve birbirine benziyor
- Genel tasarım "web app" gibi, "native app" hissi yok
- Description tamamı gösteriliyor — mobilde çok uzun olabilir

---

### Tasarım Vizyonu: iOS Music/Podcast Player Tarzı

Sayfayı 3 net bölüme ayırıyoruz:

```text
┌─────────────────────────┐
│  ← Back      Guide Hero │  Compact header + blurred bg
│  ┌───────────────────┐  │
│  │   Guide Image     │  │  Rounded, centered
│  └───────────────────┘  │
│  Title (bold, centered) │
│  📍 Location · ⏱ 12min │
│  🌐 [EN] [TR] [日本語]   │  Pill-style language chips
├─────────────────────────┤
│  Tab Pills (horizontal) │  Scrollable, pill-shaped
│  ┌─ Chapter 1 ─────── ┐│
│  │ ▶ Avanos    2:39   ││  Clean rows, tap to play
│  │ ▶ Uchisar   2:34   ││
│  └─────────────────────┘│
├─────────────────────────┤
│  ⭐ Rate this guide      │  Collapsible review section
│  [Star Rating]           │
│  [Comment] [Submit]      │
└─────────────────────────┘
```

---

### Değişiklik 1: `src/pages/AudioAccess.tsx` — Tam Yeniden Tasarım

**Guide Hero Section** (üst kısım):
- Navigation kaldır, yerine minimal back button + guide title (iOS navbar stili)
- Guide image: `w-48 h-48 rounded-2xl mx-auto shadow-xl` — merkezi, büyük köşeli
- Image arkasına blur gradient arka plan (guide image'ın renklerinden)
- Title: merkezi, `text-xl font-bold`
- Location + duration: tek satır, ikonlarla, `text-sm text-muted-foreground`
- Category badge: image üstünde overlay olarak (sol üst köşe)
- Description: `line-clamp-2` ile kısalt, "more" ile genişletilebilir

**Language Selector** (guide hero altında):
- Mevcut GuideLanguageSelector'ı koruyoruz (zaten pill-style)
- Ama daha compact — padding azalt, `mt-4` ile hero'ya bağla

**Tab Bar** (linked guides):
- `grid-cols-1` yerine **horizontal scroll** (`flex overflow-x-auto gap-2`)
- Her tab: pill-shaped chip, `rounded-full px-4 py-2`
- Active tab: `bg-primary text-white`, inactive: `bg-muted/50`
- Tek guide varsa tab bar gösterme (mevcut davranış korunuyor)

**Chapter List** (değişmez — çalışan bir yapı, dokunulmuyor):
- ChapterList component'i olduğu gibi kalıyor
- Sadece container'a `rounded-2xl overflow-hidden` ekle

**Review Section**:
- "Leave a Review" h3 tekrarı kaldır (zaten Card içinde var)
- Collapsible yap — başlangıçta kapalı, "⭐ Share your feedback" butonu ile açılır
- Açıldığında smooth `max-h` animasyonu ile

**Error/Loading States**:
- Mevcut AudioGuideLoader korunuyor (zaten iOS-vari)
- Error state'de daha yumuşak tasarım — rounded card, soft renkler

### Değişiklik 2: `src/components/MultiTabAudioPlayer.tsx` — Tab Bar iOS Stili

- TabsList'i horizontal scroll pill-bar'a çevir
- `grid-cols-1` kaldır → `flex overflow-x-auto snap-x gap-2 pb-2`
- Her TabsTrigger: `rounded-full whitespace-nowrap` pill stili
- Loading state'i daha subtle yap (skeleton pills)

### Değişiklik 3: `src/components/GuestReviewForm.tsx` — Compact Mobil Form

- Card border'ını kaldır → `border-0 shadow-none bg-transparent`
- CardHeader'ı sadeleştir
- Input/Textarea: iOS-vari `rounded-xl bg-muted/30` stili
- Star rating: daha büyük touch target (`w-8 h-8`)
- Submit button: `rounded-xl` full width

### Dokunulmayacak Dosyalar (Ses Güvenliği)
- `NewSectionAudioPlayer.tsx` — **DOKUNULMAZ** (audio playback logic)
- `ChapterList.tsx` — **DOKUNULMAZ** (çalışan chapter list + progress bar)
- `useAudioProgress.ts`, `useAudioSource.ts` — **DOKUNULMAZ**
- Audio URL resolution, playback, pre-resolve logic — **DOKUNULMAZ**

### Animasyonlar
- Tüm geçişler `transition-all duration-300` veya CSS `transition` ile
- `transform` ve `opacity` tabanlı — layout shift yok, GPU accelerated
- `will-change: transform` kullan
- Hero image: `animate-in fade-in-0 zoom-in-95 duration-500`
- Chapters: `animate-in fade-in-0 slide-in-from-bottom-2` staggered

---

### Etkilenen Dosyalar
- `src/pages/AudioAccess.tsx` — tam layout yeniden tasarım
- `src/components/MultiTabAudioPlayer.tsx` — tab bar stili
- `src/components/GuestReviewForm.tsx` — compact form stili

### Sonuç
- iOS Music app hissi — temiz, minimal, hiyerarşik
- Ses dosyaları ve playback logic'e **sıfır** müdahale
- Tüm çeviriler korunuyor
- GPU-accelerated animasyonlar, sıfır kasma
- Mobilde mükemmel touch target'lar

