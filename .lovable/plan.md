

## ElevenLabs Ses Listesi Sorunları ve Çözüm

### Tespit Edilen Sorunlar

Edge function'ı Türkçe ile test ettim. Üç kritik sorun var:

1. **Dil filtresi çalışmıyor**: `language=Turkish` gönderilmesine rağmen dönen shared seslerinin tamamı `languages: ["en"]` — yani hepsi İngilizce. ElevenLabs shared-voices API'si muhtemelen `"tr"` gibi ISO kodu bekliyor, `"Turkish"` değil.

2. **Kalite filtresi tamamen bozuk**: Tüm shared sesler `usage_count: 0` ile dönüyor. Bu, API'nin `usage_character_count` alanını bu endpoint'te döndürmediği veya farklı bir alan adı kullandığı anlamına geliyor. Dolayısıyla `>= 1000` filtresi hiçbir şeyi filtrelemiyor — tüm düşük kaliteli sesler listeleniyor.

3. **Kategori filtresi kullanılmıyor**: ElevenLabs shared-voices API'si `category=professional` ve `category=high_quality` parametrelerini destekliyor ama biz bunları kullanmıyoruz.

### Çözüm

**`supabase/functions/list-voices/index.ts`** güncellenecek:

1. **Dil kodu dönüştürme**: Frontend'den gelen `"Turkish"` gibi dil isimlerini ElevenLabs'in beklediği ISO koduna (`"tr"`) çeviren bir mapping ekle
2. **Kategori filtresi**: `category=professional` veya `category=high_quality` kullanarak sadece kaliteli sesleri getir — trending sort ile birleştir
3. **Çift istek stratejisi**: İlk olarak `category=professional` ile, sonra da genel `trending` ile iki ayrı istek at. Professional sesler listenin başında, trending sesler altında gösterilsin
4. **Gereksiz kalite filtresini kaldır**: `usage_character_count` filtresi zaten çalışmıyor, bunun yerine ElevenLabs'in kendi `category` ve `sort` parametrelerine güven
5. **Sayfa boyutunu artır**: Professional sesler az olabilir, 100'e çıkar

### Teknik Detay

```text
Mevcut akış:
  Frontend → "Turkish" → list-voices → /v1/shared-voices?language=Turkish&sort=trending
  Sonuç: Hepsi İngilizce, hepsi usage_count=0 → kalite filtresi bypass

Yeni akış:
  Frontend → "Turkish" → list-voices → dil kodu dönüşümü ("Turkish" → "tr")
  → İstek 1: /v1/shared-voices?language=tr&category=professional&page_size=50
  → İstek 2: /v1/shared-voices?language=tr&sort=trending&page_size=50
  → Birleştir: ★ Own sesler + Professional sesler + Trending sesler (deduplicate)
```

### Dil Kodu Mapping

```typescript
const LANG_NAME_TO_CODE: Record<string, string> = {
  'English': 'en', 'Turkish': 'tr', 'Russian': 'ru',
  'German': 'de', 'French': 'fr', 'Spanish': 'es',
  'Italian': 'it', 'Portuguese': 'pt', 'Arabic': 'ar',
  'Chinese': 'zh', 'Japanese': 'ja', 'Korean': 'ko',
  'Hindi': 'hi', 'Dutch': 'nl', 'Polish': 'pl',
  'Greek': 'el', 'Czech': 'cs', 'Romanian': 'ro',
  // ... diğer diller
};
```

### Değişiklik

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/functions/list-voices/index.ts` | Dil ismi → ISO kod dönüşümü ekle, `category=professional` filtresi ekle, çift istek stratejisi, bozuk usage_count filtresini kaldır |

