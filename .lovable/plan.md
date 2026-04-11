

## Guide Kartlarını Kulaklık Tasarımına Dönüştürme

### Konsept

Mevcut dikdörtgen kartları, önden görünümlü bir kulaklık siluetine dönüştürmek. Boyutlar aynı kalacak ama şekil organik ve kulaklık formunda olacak.

```text
          ╭──────────────────────────╮
         ╱   🎧 Cappadocia: Valleys   ╲      ← kemerli headband
        ╱                               ╲
       │                                 │
    ╭──┘                                 └──╮   ← band bağlantıları
  ╭──────╮                            ╭──────╮
  │      │                            │      │
  │ IMG  │   📍 Location              │  ▶   │  ← ear cup'lar
  │      │   ⏱ 66 min                │      │
  │      │   🎧 54 listening          │      │
  ╰──────╯                            ╰──────╯
```

### Tasarım Detayları

**1. Headband (Kafa Bandı)**
- Mevcut üst başlık bandı → yukarı doğru kavisli bir kemer şekline dönüşecek
- CSS: `border-radius: 50% 50% 0 0 / 80px 80px 0 0` ile kemer etkisi
- İçinde kulaklık ikonu + başlık metni (mevcut gibi)
- Her iki yandan aşağı doğru ince "bant" uzantıları (pseudo-elements)

**2. Sol Ear Cup (Görsel)**
- Mevcut kare görsel → tam yuvarlak (rounded-full) olacak
- Etrafında kalın, yarı saydam bir "cushion" halkası (ring-4 veya box-shadow)
- Featured: amber halka, Normal: primary halka
- İçinde category badge korunacak

**3. Sağ Ear Cup (Play Butonu)**
- Mevcut küçük play butonu → büyük dairesel ear cup boyutuna (w-20 h-20)
- Sol ear cup ile simetrik boyutta
- İçinde play ikonu + waveform animasyonu

**4. Orta Alan (Metadata)**
- İki ear cup arasında kalan alanda: konum, süre, diller, listening badge
- Dikey olarak ortalanmış
- Kompakt ama okunabilir

**5. Band Bağlantıları**
- Headband'den ear cup'lara inen ince dikey çizgiler
- CSS pseudo-elements (::before, ::after) ile
- 2-3px genişliğinde, gradient renkte

### Değişecek Dosyalar

- `src/components/GuideCard.tsx` — tam yeniden yapılandırma (HTML yapısı + class'lar)
- `src/index.css` — headphone-card için özel keyframes ve clip-path tanımları

### Korunan Özellikler
- Tıklama davranışı (navigate)
- Featured/normal renk ayrımı (amber vs primary)
- Waveform animasyonu (ear cup içine taşınacak)
- LiveListenersBadge (compact)
- Dil bayrakları
- Active scale efekti
- Tüm kullanım yerleri (Index, Guides, FeaturedGuides, CountryDetail, FeaturedGuides component) değişiklik gerektirmez — sadece GuideCard içi değişir

### Boyut Uyumu
- Toplam kart genişliği: mevcut ile aynı (grid tarafından kontrol ediliyor)
- Toplam yükseklik: ~benzer (headband kemeri biraz ekler ama ear cup'lar daha kompakt)
- Mobil 390px viewport'ta tek kolon, düzgün sığacak

### Performans
- Sadece CSS değişikliği, ek JS/state yok
- Pseudo-elements lightweight
- Mevcut animasyonlar korunacak

