

## Plan: Pill Butonlarını İyileştir — Badge Kaldır, Daha Tıklanabilir Yap, Yüklemeyi Hızlandır

### Değişiklikler (`src/components/MultiTabAudioPlayer.tsx`)

1. **Section count badge'lerini kaldır** — Main guide pill (satır 261-265) ve linked guide pill (satır 287-291) içindeki `Badge` bileşenlerini sil. Kullanıcı tıklayınca içeriği zaten görüyor.

2. **Pill butonlarını daha tıklanabilir yap**:
   - Sağ tarafa bir `ChevronRight` ikonu ekle (tıklanabilir olduğunu görsel olarak belirt)
   - Pasif pill'lere hafif border ekle (`border-border/50`) ve hover'da daha belirgin gölge (`hover:shadow-sm`)
   - Font boyutunu `text-sm` → `text-base` yap, başlıklar daha okunur olsun

3. **Yükleme hızını artır** — `loading` state'i `true` olarak başlıyor (satır 56) ve `loadLinkedGuides` tamamlanana kadar spinner gösteriyor. Eğer `mainSections` zaten varsa, linked guide'lar arka planda yüklenirken ana içeriği hemen göster:
   - `loading` başlangıç değerini `false` yap
   - `loadLinkedGuides` tamamlanınca linked pill'leri ekle (progressive rendering)
   - `AudioGuideLoader` spinner'ını sadece `mainSections` boşken göster

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MultiTabAudioPlayer.tsx` | Badge kaldır, ChevronRight ekle, pill stilini güncelle, loading stratejisini değiştir |

