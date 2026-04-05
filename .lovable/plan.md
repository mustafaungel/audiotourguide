

## Plan: Dil Seçildiğinde Diğer Dilleri Gizle / Toggle

### Davranış
- Bir dil butonuna tıklanınca: sadece seçili dil görünür, diğerleri gizlenir
- Aynı dil tekrar tıklanınca: seçim iptal edilmez ama tüm diller tekrar görünür (toggle)
- Tek dil varsa hiçbir şey değişmez

### Değişiklik — `src/components/GuideLanguageSelector.tsx`

**1. Yeni state ekle:** `collapsed` (boolean, default `false`)

**2. `handleLanguageSelect` güncelle:**
- Eğer tıklanan dil zaten seçili VE `collapsed` true ise → `setCollapsed(false)` (dilleri aç)
- Aksi halde → dil değiştir + `setCollapsed(true)` (diğerlerini gizle)

**3. Render'da filtreleme:**
- `collapsed` true ise sadece `selectedLanguage` ile eşleşen dili göster
- `collapsed` false ise tüm dilleri göster
- Animasyon için `transition-all duration-200` + `overflow-hidden` kullan

**4. Performans:**
- Sadece bir boolean state toggle — DOM manipülasyonu minimal
- `key` prop'ları sabit kalacak, React reconciliation hızlı
- Fetch/network çağrısı yok, tamamen client-side

### Etkilenen Dosya
- `src/components/GuideLanguageSelector.tsx` — tek dosya, ~15 satır değişiklik

Bu bileşen zaten hem AudioAccess hem GuideDetail sayfalarında kullanılıyor, değişiklik her iki sayfada otomatik geçerli olacak.

