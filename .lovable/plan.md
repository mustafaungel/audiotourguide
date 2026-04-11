

## Arama İyileştirmeleri: Otomatik Tamamlama + Mobil Zoom Engelleme + UX

### Yapılacaklar

**1. Otomatik Tamamlama (Autocomplete) Bileşeni**

Yeni bir `SearchAutocomplete` bileşeni oluşturulacak. Kullanıcı yazdıkça mevcut rehber verilerinden eşleşen sonuçları dropdown olarak gösterecek (şehir adı, rehber adı, kategori). Mobilde tam genişlikte, masaüstünde max-width ile sınırlı.

- Debounce (300ms) ile performans koruması
- Dropdown'da eşleşen rehber başlığı + lokasyon gösterilecek
- Tıklayınca direkt o rehberin detay sayfasına gidecek VEYA arama terimini dolduracak
- Dışarı tıklayınca dropdown kapanacak

**2. Mobil Zoom Engelleme**

Tüm arama input'larına `text-[16px]` class'ı eklenecek (iOS'ta 16px altı font zoom tetikliyor). Bu zaten memory'de belirtilmiş ama bazı sayfalarda uygulanmamış.

**3. X (Temizle) Butonu**

Guides sayfasında zaten "Clear" butonu var ama ayrı bir buton olarak. FeaturedGuides ve Countries sayfalarında yok. Tüm arama input'larının içine (sağ tarafa) küçük X ikonu eklenecek.

**4. Kategori Chip'leri (Guides Sayfası)**

Arama altına yatay kaydırılabilir kategori chip'leri: mevcut rehberlerden unique kategoriler çekilip gösterilecek. Tek dokunuşla filtreleme.

**5. Filters Butonu (Guides Sayfası)**

Mevcut çalışmayan Filters butonunu aktif hale getir — Bottom Sheet (mobil) açılacak, içinde kategori seçenekleri olacak.

### Dosyalar

```
Yeni dosya:
  src/components/SearchAutocomplete.tsx — Autocomplete dropdown bileşeni

Düzenlenecek dosyalar:
  src/pages/Guides.tsx
    - SearchAutocomplete entegrasyonu
    - Kategori chip'leri (yatay scroll)
    - Filters butonu → Bottom Sheet aç
    - Input'a text-[16px] ekle

  src/pages/FeaturedGuides.tsx
    - SearchAutocomplete entegrasyonu
    - X temizle butonu
    - Input'a touch-target, mobile-text, text-[16px] ekle

  src/pages/Countries.tsx
    - Input içine X temizle butonu
    - Input'a text-[16px] ekle (zaten mobile-text var ama doğrulama)
```

### Autocomplete Mantığı

- Guides/FeaturedGuides: Mevcut `guides` array'inden `title` ve `location` alanlarını filtrele
- Countries: Mevcut `countries` array'inden `country` alanını filtrele
- Minimum 2 karakter sonrası öneriler gösterilecek
- Maksimum 5 öneri gösterilecek

