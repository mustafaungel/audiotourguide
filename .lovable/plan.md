

## Analiz ve Iyilestirme Plani

### Mevcut Durum

Claude uzerinde yapilan son guncellemeleri inceledim. Asagidaki bulgular ve iyilestirme onerileri:

### 1. Border Tutarliligi (Dark Mode)

Light mode'da borderlar zaten yumusak (`25 20% 80%` — arka plana yakin). Dark mode'da ise `25 12% 30%` — arka plan `25 20% 6%` oldugu icin kontrast fazla, borderlar belirgin gorunuyor.

**Cozum:** Dark mode `--border` degerini `25 12% 18%` gibi daha yumusak bir degere cek. `--input` border'ini da uyumlu hale getir.

### 2. Yazi Fontlari - Daha Canli Tipografi

Suanki durum: Basliklar `Plus Jakarta Sans`, govde `Inter`. Ikisi de geometrik ve notr fontlar — "cansiz" hissi veriyor.

**Cozum:**
- Basliklar icin `Plus Jakarta Sans` yerine **`Sora`** veya mevcut `Playfair Display`'i aktif et — daha karakterli
- Govde fontu `Inter` kalsin (okunabilirlik icin en iyisi)
- Baslik `letter-spacing`'i `-0.03em`'e artir, `font-weight` 700 → 800 yap
- `h1` icin ozel bir gradient text efekti ekle (primary → tourism-earth)

### 3. Featured Guides Sayfasi — Ayni Tasarim Kullanmali

**Sorun:** `src/pages/FeaturedGuides.tsx` tamamen farkli bir kart tasarimi kullaniyor (dikey Card/CardContent ile). Ana sayfa ve Guides sayfasi ise `GuideCard` bilesenini kullaniyor.

**Cozum:** FeaturedGuides sayfasini refactor et:
- Mevcut ozel kart yapisini kaldir
- `GuideCard` bilesenini kullan (Index ve Guides ile ayni)
- Ayni grid yapisini kullan (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3`)
- Sayfa header'ini Guides sayfasiyla uyumlu tut

### 4. Admin Featured Toggle — Zaten Mevcut

AdminGuideOrderManager'da Star ikonu ile featured toggle zaten var (satir 243-255). Ek bir islem gerekmiyor.

### 5. Featured Badge — Zaten Mevcut

GuideCard'da `isFeatured` prop'u zaten altin rengi top band olarak gosteriliyor (satir 66-81). Ek bir islem gerekmiyor.

---

### Degisiklik Ozeti

| Dosya | Degisiklik |
|-------|-----------|
| `src/index.css` | Dark mode `--border` ve `--input` degerlerini yumusalt; baslik font-weight ve letter-spacing artir; gradient text utility ekle |
| `src/pages/FeaturedGuides.tsx` | Ozel kart yapisini kaldir, `GuideCard` bileseni ile degistir, ayni grid layout kullan |
| `index.html` | Font import'larini guncelle (eger Sora ekliyorsak) |

### Teknik Detay

```text
Dark mode border degisikligi:
  --border: 25 12% 30%  →  25 12% 18%
  --input:  25 12% 20%  →  25 12% 15%

Baslik tipografi:
  h1-h4 letter-spacing: -0.02em → -0.03em
  h1-h4 font-weight: semibold ekle (zaten var, 800'e artir)

FeaturedGuides refactor:
  Mevcut: Ozel Card/CardContent ile dikey kart
  Yeni: GuideCard bilesenini import et, ayni props ile kullan
```

