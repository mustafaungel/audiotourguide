

## Plan: Fetch Fallback ile Audio Upload Hatasini Cozme

### Sorun
Supabase JS SDK, storage upload yaniti olarak duz metin ("Audio not available") aliyor ve bunu JSON olarak parse etmeye calisiyor. Bu bir SDK sinirlamasi -- SDK her zaman JSON bekliyor ama sunucu bazen duz metin donduruyor.

### Cozum
`src/components/AudioGuideSectionManager.tsx` dosyasindaki `uploadAudioFile` fonksiyonuna **direct fetch fallback** eklenecek.

### Adimlar

**1. `uploadViaFetch` yardimci fonksiyonu ekle**
- Supabase Storage REST API'sine dogrudan `fetch` ile POST yapacak
- `Authorization: Bearer <jwt>` ve `apikey` header'lari kullanacak
- Yaniti `response.text()` ile okuyacak (JSON parse denemeyecek)
- `response.ok` ise basarili kabul edecek ve `getPublicUrl` ile URL olusturacak
- Basarisizsa status ve ham yanitla hata dondurecek

**2. `uploadAudioFile` akisini guncelle**
- Oncelikle mevcut SDK upload'i denenecek (degisiklik yok)
- Eger hata mesaji "not valid JSON" veya "Unexpected token" iceriyorsa:
  - Console'a `[AUDIO-UPLOAD][FALLBACK]` uyarisi yazilacak
  - `uploadViaFetch` cagirilacak
  - Basariliysa normal akis devam edecek (publicUrl, duration, section update)
  - Basarisizsa HTTP status ve ham metin toast ile gosterilecek
- Diger hata tiplerinde mevcut ozel mesajlar korunacak (413, 415, 401/403)

**3. `x-upsert` header'i**
- Fetch fallback'te `'x-upsert': 'true'` header'i eklenecek (SDK'daki upsert: true'nun karsiligi)

### Teknik Detay

```text
uploadAudioFile(sectionId, file)
  |
  +--> SDK upload dene
  |      |
  |      +--> Basarili? --> devam (URL, duration, update)
  |      |
  |      +--> Hata "not valid JSON"?
  |             |
  |             +--> uploadViaFetch(fileName, file)
  |                    |
  |                    +--> fetch POST /storage/v1/object/guide-audio/{fileName}
  |                    |    Headers: Authorization, apikey, Content-Type, x-upsert
  |                    |    Body: file
  |                    |
  |                    +--> response.ok? --> getPublicUrl --> devam
  |                    +--> !response.ok? --> toast.error(status + text)
  |
  +--> Diger hatalar --> mevcut error handling (413/415/401 vs.)
```

### Etkilenen Dosya
- `src/components/AudioGuideSectionManager.tsx` -- sadece upload fonksiyonu

### Risk
- Dusuk. Fallback yalnizca SDK basarisiz oldugunda devreye girer. Basarili SDK upload'lari etkilenmez.
- Player, URL parametreleri, diger bilesenler degismez.

