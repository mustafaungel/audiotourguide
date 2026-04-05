

## Plan: AudioAccess Dark/Light Toggle + Tab UX Fix + İçerik Çevirisi + Admin Test Sayfası

### 4 değişiklik yapılacak:

---

### 1. Dark/Light Toggle — AudioAccess Navbar'a Ekle
`src/pages/AudioAccess.tsx` — Mevcut sticky navbar'daki "spacer div" yerine `ThemeToggle` bileşenini koy. Böylece sağ üst köşede güneş/ay ikonu ile tema değiştirilebilir.

Satır 646'daki `<div className="w-12" />` → `<ThemeToggle />`

---

### 2. Linked Guide Tab'ları — Horizontal Scroll Yerine Dikey Liste
Mevcut `overflow-x-auto` horizontal scroll mobilde keşfedilemez — kullanıcı yana kaydırılacağını anlamıyor.

**Çözüm**: `MultiTabAudioPlayer.tsx`'te tab'ları dikey chip listesi (wrap) olarak göster:
- `flex overflow-x-auto snap-x` → `flex flex-wrap gap-2`
- `whitespace-nowrap shrink-0` → kaldır, tab'lar wrap yaparak alta geçsin
- `max-w-[140px] truncate` → `max-w-[180px]` ile daha okunabilir
- Bu sayede tüm guide başlıkları ekranda görünür, yana kaydırma gerekmez

---

### 3. Dil Değişiminde İçerik Çevirisi (Title, Description)
Mevcut durumda `guide.title` ve `guide.description` sadece `audio_guides` tablosundan geliyor — tek dil. Section title'ları zaten `guide_sections` tablosunda dil bazlı.

**Çözüm**: `AudioAccess.tsx`'te dil değiştiğinde:
- Section title/description zaten dil bazlı yükleniyor (mevcut davranış ✓)
- Ana guide title ve description için: `guide_sections` tablosundaki ilk section'ın dil grubundan title kullanmak yerine, sayfada gösterilen `guide.title` ve `guide.description`'ı olduğu gibi bırak (bunlar veritabanında tek dilde) — ama UI label'ları (butonlar, "min", "Leave a Review" vb.) zaten `t()` fonksiyonu ile çevriliyor ✓
- Eğer kullanıcı farklı dile tıklarsa, chapter listesi o dildeki section'lar ile güncelleniyor — bu zaten çalışıyor

**Not**: `audio_guides.title` ve `audio_guides.description` alanları tek dilde saklanıyor (genelde İngilizce). Bunları çevirmek için ya veritabanına çeviri tablosu eklemek ya da client-side çeviri API'si kullanmak gerekir. Şu an en pratik çözüm: mevcut `t()` fonksiyonu ile tüm UI metinlerinin çevrilmesini sağlamak ve guide content'in section bazlı çevirisini korumak.

---

### 4. Admin Test/Preview Sayfası
Yeni sayfa: `src/pages/AdminPreview.tsx` — Admin'in publish öncesi AudioAccess sayfasını test etmesi için.

**Özellikler**:
- `/admin/preview` rotası (App.tsx'e ekle)
- Admin'in guide seçebileceği bir dropdown (tüm guide'lar — published veya değil)
- Seçilen guide'ın AudioAccess sayfasını `master_access_code` ile iframe veya inline olarak göster
- Checklist paneli: ses çalıyor mu, dil değişimi çalışıyor mu, linked guide'lar yükleniyor mu
- Sadece admin erişimi (`useIsAdmin` hook)

**Yapı**:
1. `src/pages/AdminPreview.tsx` — guide listesi + preview iframe
2. `src/App.tsx` — `/admin/preview` rotası ekle
3. `src/pages/AdminPanel.tsx` — "Preview & Test" tab'ı ekle (link olarak)

---

### Etkilenen Dosyalar
- `src/pages/AudioAccess.tsx` — ThemeToggle import + navbar'a ekle
- `src/components/MultiTabAudioPlayer.tsx` — tab layout: horizontal scroll → flex-wrap
- `src/pages/AdminPreview.tsx` — **yeni dosya**
- `src/App.tsx` — yeni rota
- `src/pages/AdminPanel.tsx` — preview tab linki

