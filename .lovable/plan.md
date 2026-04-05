

## Plan: AudioAccess Sayfası ve Genel Mobil UX Düzeni — Hizalama, Okunabilirlik, Dokunma Kolaylığı

### Sorun
AudioAccess sayfasında yazılar dağınık, hizasız; mobilde tıklama alanları küçük, seçim yapıldığı net anlaşılmıyor. Tab pill'leri, chapter listesi, dil seçici ve metadata alanları düzensiz görünüyor.

---

### Değişiklik 1: `src/pages/AudioAccess.tsx` — Hero & Metadata Hizalama

- Hero bölümünde metadata (konum, süre) satırını `justify-center` ile ortalı tut, aralarında tutarlı `gap-3`
- Description alanını `text-center` ile ortala, `max-w-sm mx-auto` ile mobilde taşmayı önle
- Language selector container'a `px-2` ekle, içerikle aynı hizada olsun
- "Leave a Review" butonuna `min-h-[48px]` (Apple HIG minimum dokunma alanı) ekle
- Navbar title'ı `text-center flex-1` yap, sağ-sol butonlarla simetrik hizala

### Değişiklik 2: `src/components/MultiTabAudioPlayer.tsx` — Tab Pill Düzeni

- Tab pill'leri `w-full` yaparak tam genişlikte göster — her pill aynı genişlikte olsun
- `flex flex-wrap gap-2` yerine `grid grid-cols-1 gap-2` kullan — her tab kendi satırında, düzenli
- Eğer 2 tab varsa `grid-cols-2`, 3+ ise `grid-cols-1` — adaptive grid
- Aktif tab'a belirgin `ring-2 ring-primary scale-[1.02]` efekti ekle — seçim net anlaşılsın
- Pill'lerdeki `truncate max-w-[180px]` yerine tam genişlikte yazı göster — başlık kesilmesin
- `min-h-[48px]` ile dokunma alanını genişlet
- Badge (section sayısı) her zaman sağa hizalı, `ml-auto` ile

### Değişiklik 3: `src/components/ChapterList.tsx` — Chapter Kartları Düzeni

- Her chapter kartı `min-h-[72px]` zaten var ama tıklama alanı artırılmalı → `min-h-[76px] p-4`
- Chapter numarası badge'i sol hizalı, play ikonu ve başlık aynı satırda
- Description `line-clamp-2` ile sınırlı, başlıkla arası `gap-1`
- Süre bilgisi her zaman sağ üstte, `tabular-nums` ile sabit genişlik
- Aktif chapter'ın border ve background'u daha belirgin: `border-2 border-primary` + subtle glow
- Card header "Up Next" başlığı ve kontroller arasında `justify-between` düzgün çalışsın

### Değişiklik 4: `src/components/GuideLanguageSelector.tsx` — Dil Butonları Düzeni

- Dil butonları `min-h-[44px] min-w-[44px]` ile dokunma dostu
- `flex flex-wrap gap-2` yerine mobilde `grid grid-cols-2 gap-2` kullan — eşit genişlikte 2 sütun
- Seçili dile daha belirgin görsel geri bildirim: `ring-2 ring-primary` + scale efekti
- Flag emoji ve dil adı arasında tutarlı `gap-2`
- Tüm butonlar eşit yükseklikte ve genişlikte olsun

### Değişiklik 5: Genel Spacing & Touch Target Standardizasyonu

- Tüm interaktif elemanlar minimum `44px` yükseklik (Apple HIG)
- `px-4` sabit padding tüm content alanlarında — sol-sağ hizalama tutarlı
- Section aralarında `space-y-4` standardı
- Tüm `active:scale-[0.97]` efektleri korunsun — dokunma geri bildirimi

---

### Etkilenen Dosyalar
- `src/pages/AudioAccess.tsx` — hero, metadata, spacing düzeni
- `src/components/MultiTabAudioPlayer.tsx` — tab pill grid layout
- `src/components/ChapterList.tsx` — chapter kart hizalaması
- `src/components/GuideLanguageSelector.tsx` — dil butonları grid layout

