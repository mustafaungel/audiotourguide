
## Plan: Fotoğraf Yükleme Limitini Artır

### Sorun
`src/components/ImageUploader.tsx` dosyasında fotoğraf boyut limiti 5MB olarak ayarlanmış. Büyük fotoğraflar yüklenemiyor.

### Yapılacak
**`src/components/ImageUploader.tsx`** dosyasında:
- Satır 33: `maxSize` değerini `5 * 1024 * 1024` → `20 * 1024 * 1024` (20MB) olarak değiştir
- Satır 35: Hata mesajını "Image must be smaller than 20MB" olarak güncelle
- Satır 156: Kullanıcıya gösterilen bilgi metnini "Max 5MB each" → "Max 20MB each" olarak güncelle

### Not
Zaten `resizeImage` fonksiyonu mevcut — yüklenen büyük fotoğraflar otomatik olarak 1200x800px'e küçültülüp JPEG olarak sıkıştırılıyor. Yani Supabase storage'a giden dosya boyutu zaten küçük olacak, buradaki limit sadece istemci tarafında gereksiz kısıtlama.

### Risk
Düşük. Tek dosyada 3 satır değişiklik.
