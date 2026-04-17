

## Plan: Section-Bazlı Google Maps — Dil Senkronizasyonlu (Cappadocia: Hidden Valleys)

### Doğrulama
Anladım. Bir section'a (örn. "Love Valley") admin İngilizce versiyonda Google Maps linki eklediğinde, **aynı section'ın Türkçe, Rusça, Fransızca vb. tüm dil versiyonlarına otomatik aynı link uygulanmalı**. Çünkü vadinin konumu dile göre değişmez — fiziksel konum aynı.

### Veri Modeli Analizi
`guide_sections` tablosunda her dil için ayrı satır var:
- `is_original = true` → orijinal (genelde EN) section
- `is_original = false` + `original_section_id` → çeviri section, orijinale referans verir

Bu yapı sayesinde **maps_url'i sadece orijinal satırda tutmak** veya **her dile yazmak** seçeneklerimiz var. Senkronizasyon için en sağlam yol: **tüm dillere aynı link yazmak** (sorgu basit kalır, frontend tek satırı okur).

---

### 1. Database — Migration
```sql
ALTER TABLE guide_sections ADD COLUMN maps_url TEXT;
```

### 2. Database — Trigger ile Otomatik Senkronizasyon
Yeni trigger: `sync_maps_url_across_languages`
- Bir section'ın `maps_url` kolonu UPDATE edildiğinde:
  - Eğer satır `is_original = true` ise → bu section'ı `original_section_id` olarak referans alan **tüm çeviri satırlarına** aynı `maps_url` yazılır
  - Eğer satır `is_original = false` ise → orijinal satıra ve onun diğer tüm çevirilerine aynı `maps_url` yazılır
- Sonsuz döngü önlemi: Trigger içinde `pg_trigger_depth() = 1` kontrolü

Bu sayede admin hangi dilde düzenlerse düzenlesin, link tüm dillere otomatik yayılır.

### 3. Admin — `AudioGuideSectionManager.tsx`
Sadece **"Cappadocia: Discover Hidden Valleys"** rehberinde (slug check ile) her section düzenleme alanında Google Maps Link input'u görünür:
- Label: "📍 Google Maps Link (this valley) — auto-synced across all languages"
- Placeholder: `https://maps.app.goo.gl/...`
- onBlur ile kaydet → trigger diğer dillere yayar
- "Test" butonu yanında → yeni sekmede açar
- Yardımcı not: "Bu link tüm dil versiyonlarına otomatik uygulanacak"

### 4. Premium Maps Pin Badge — `ChapterList.tsx`
Section numarasının olduğu dairesel badge (`w-9 h-9 rounded-full`), `section.maps_url` varsa **Google Maps tarzı kırmızı pin ikonuna** dönüşür:

- Background: `bg-gradient-to-br from-red-500 to-red-600` (Google Maps tanıdık kırmızı)
- Featured rehberlerde: `from-amber-500 to-amber-600` korunur (tema uyumu)
- İçerik: Lucide `MapPin` ikonu (`w-4 h-4`, beyaz, fill)
- 3D shadow: `shadow-[0_4px_12px_rgba(239,68,68,0.4)]`
- Hover: `scale-110` + glow
- Active: `scale-95`
- Tıklama: `e.stopPropagation()` → `openMapsLink(section.maps_url)`
- Currently playing section ise: numara/play badge öncelikli, maps pin sağ-alt köşede mini overlay olarak görünür (kullanıcı yine erişebilir)
- aria-label: `"Open this valley in Google Maps"`

### 5. Smart Open — `src/lib/maps-utils.ts`
Yeni fonksiyon `openMapsLink(url)`:
- iOS: `maps://?q=...` deneme + 600ms fallback `https://`
- Android: direkt `https://` (Google Maps app intent yakalar)
- Desktop: yeni sekmede `https://`
- Short link (`maps.app.goo.gl`) ise direkt redirect

### 6. GuideDetail.tsx — Eski Büyük Kart Kaldırılacak
Rehber seviyesindeki "View on Google Maps" büyük kartı silinecek (`guide.maps_url` kullanılan blok). Section bazlı pin'ler yeterli ve daha temiz.

### 7. Veri Akışı
- `AudioAccess.tsx` ve `GuideDetail.tsx` `guide_sections` SELECT query'lerine `maps_url` eklenir
- `Section` interface'ine `maps_url?: string` eklenir

---

### Dosya Değişiklikleri (6 + 1 migration)
1. **Migration**: `ALTER TABLE` + sync trigger
2. `src/components/AudioGuideSectionManager.tsx` — Conditional input (sadece Cappadocia)
3. `src/components/ChapterList.tsx` — Numara badge'i koşullu Maps Pin'e dönüşür
4. `src/lib/maps-utils.ts` — `openMapsLink()` helper
5. `src/pages/AudioAccess.tsx` — Query + Section type güncelle
6. `src/pages/GuideDetail.tsx` — Query güncelle + büyük kart sil

### Test Akışı
1. Admin → Cappadocia: Hidden Valleys → Love Valley section'ı (EN) → Maps link yapıştır
2. Trigger otomatik olarak Love Valley'in TR, RU, FR, vb. tüm dil satırlarına aynı linki yazar
3. Kullanıcı hangi dilde dinlerse dinlesin, Love Valley'in solunda kırmızı 📍 pin görünür
4. Pin'e tıkla → telefonda Maps app açılır
5. Tıklama audio'yu tetiklemez
6. Diğer rehberlerde her şey eskisi gibi (admin alanı görünmez, normal numara badge'leri korunur)

