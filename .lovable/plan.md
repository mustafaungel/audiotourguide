

## Sorun Özeti

`Cappadocia Green (South) Tour` için Portekizce dilini eklerken `AddLanguageDialog` kullanıldı. 3 ayrı sorun var:

### 1. Audio Upload Hatası: "Audio not available" is not valid JSON
**Sebep**: `AddLanguageDialog.tsx` (satır 130) Supabase SDK'sı ile direkt upload yapıyor. Storage zaman zaman düz metin (`Audio not available`) döndürüyor ve SDK bunu JSON parse etmeye çalışınca çöküyor. `AudioGuideSectionManager`'da bu sorun için zaten **fetch fallback** mekanizması var (satır 398-415) ama `AddLanguageDialog`'da yok.

### 2. Portekizce Çeviri Kaydedilmemiş Olabilir (KRİTİK)
**Sebep**: Çeviriler `translatedSections` state'inde tutuluyor. DB'ye yazılması için kullanıcının **tüm sectionlara audio yükleyip** son adımda "Save" butonuna basması gerekiyor (satır 184). Audio upload hatası sonrası dialog kapandıysa **çeviriler kaybolmuş** demektir.

### 3. Ekranın Kapanması
Dialog `onOpenChange` ile dış tıklamada kapanıyor — kullanıcı yanlışlıkla dışına tıklamış olabilir, ya da hata sonrası state kaybı yaşandı.

---

## Plan

### Değişiklik 1 — `src/components/AddLanguageDialog.tsx`
Audio upload akışını `AudioGuideSectionManager`'daki proven pattern ile değiştir:
- SDK upload dene → JSON parse hatası alırsan direkt `fetch` ile retry
- Hata mesajını anlamlı hale getir (`Audio not available` → "Storage geçici olarak yanıt vermiyor, tekrar deneyin")

### Değişiklik 2 — Çeviriyi DB'ye anında kaydet (data loss önleme)
Çeviri tamamlandığı an (`step === 'upload'` geçişinde) sectionları DB'ye `audio_url: null` ile **hemen insert** et. Audio sonra eklenince UPDATE yapılır.
- Avantaj: Dialog kapansa bile çeviriler güvende
- "Save" butonu artık sadece eksik audio URL'lerini günceller
- Idempotent: Aynı dil için tekrar açılırsa mevcut sectionları yükle

### Değişiklik 3 — Dialog'u accidental close'a karşı koru
- `onOpenChange`'i sadece `step === 'select'` veya `step === 'done'` iken serbest bırak
- Translating/upload/saving sırasında dış tıklama dialog'u kapatmasın
- Açık X butonu ile kapatma her zaman çalışır (uyarı confirmation ile)

### Acil Doğrulama (bu sohbette yapılacak)
Mevcut `Cappadocia Green Tour` için Portekizce sectionlar DB'ye yazılmış mı? Plan onaylanır onaylanmaz şu sorguyu çalıştıracağım:
```sql
SELECT language_code, count(*), 
       count(audio_url) as with_audio
FROM guide_sections 
WHERE guide_id = '<cappadocia-green-tour-id>'
GROUP BY language_code;
```
Sonuca göre:
- **Kayıtlı ise**: Sadece audio yükleme akışı düzeltilecek, kullanıcı dialog'u tekrar açıp audioları ekleyebilir
- **Kayıtlı değilse**: Çeviri tekrar yapılacak (English scriptler hâlâ duruyor) + yukarıdaki fix'ler

### Etkilenen Dosyalar
- `src/components/AddLanguageDialog.tsx` (tek dosya değişikliği — ~40 satır)

### Etkilenmeyenler
- Çeviri/translate-script edge function'ı (zaten çalışıyor)
- AudioGuideSectionManager (zaten doğru pattern var)

