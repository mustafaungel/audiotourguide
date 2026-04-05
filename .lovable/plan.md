

## Plan: Fotoğraf Yükleme Limitini 200MB'a Çıkar

### Yapılacak
**`src/components/ImageUploader.tsx`** dosyasında:
- `maxSize` değerini `20 * 1024 * 1024` → `200 * 1024 * 1024` (200MB) olarak değiştir
- Hata mesajını "Image must be smaller than 200MB" olarak güncelle
- Kullanıcıya gösterilen bilgi metnini "Max 200MB each" olarak güncelle

### Not
`resizeImage` fonksiyonu yüklenen fotoğrafları otomatik olarak 1200x800px JPEG'e sıkıştırdığı için Supabase'e giden dosya boyutu küçük kalacak. Bu limit sadece istemci tarafı kontrol.

### Risk
Düşük. 3 satır değişiklik.

