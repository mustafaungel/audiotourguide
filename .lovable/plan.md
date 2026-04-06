

## Plan: Content Management'ta Gerçek Dilleri Göster

### Sorun

`AdminGuideOrderManager` guide'ların dillerini `audio_guides.languages` sütunundan okuyor. Bu sütun sadece oluşturma sırasında set ediliyor ve sonradan eklenen çeviriler (guide_sections tablosundaki farklı `language_code` kayıtları) buraya yansımıyor.

Örnek: ATV Tour — `languages` sütunu `["English"]` ama `guide_sections`'da 9 dil var (de, en, es, it, ja, ko, pt, ru, zh).

### Çözüm

`AdminGuideOrderManager.tsx`'de `fetchGuides` fonksiyonunu güncelleyerek `guide_sections` tablosundan gerçek dilleri çekmek.

### Değişiklik — `src/components/AdminGuideOrderManager.tsx`

1. `fetchGuides` içinde guide'ları çektikten sonra, her guide'ın gerçek dillerini `guide_sections`'dan sorgula:

```sql
SELECT guide_id, array_agg(DISTINCT language_code) as langs
FROM guide_sections
WHERE guide_id IN (...)
GROUP BY guide_id
```

2. Dönen sonuçla her guide'ın `languages` alanını override et (UI'da gösterim için).

3. Mevcut `getLanguageFlag` ve `getLanguageName` fonksiyonları zaten language code'larla çalışıyor, ancak `audio_guides.languages` sütunu `"English"` gibi isim tutuyor, `guide_sections.language_code` ise `"en"` gibi kod tutuyor. Bu yüzden mapping'in doğru çalışması için kontrol gerekecek — muhtemelen `getLanguageName` zaten her iki formatı da handle ediyor ama doğrulanacak.

4. Expanded row'daki "📋 Diller:" label'ını "📋 Languages:" olarak değiştir (İngilizce standart).

### Etkilenen Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminGuideOrderManager.tsx` | `fetchGuides`'da `guide_sections`'dan gerçek dilleri çek, label İngilizce yap |

### Dokunulmayacak
- `audio_guides.languages` sütunu — mevcut haliyle kalacak (başka yerlerde kullanılıyor olabilir)
- `AdminLanguageManagement` — ayrı sayfa, değişiklik yok

