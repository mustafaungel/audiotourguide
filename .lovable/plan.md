

## Plan: Audio Upload "Storage temporarily unavailable" Hatasının Çözümü

### Kök Neden
`guide-audio` storage bucket'ında **dosya boyutu limiti 50 MB** (`52,428,800 bytes`). Fransızca çevirisi yapılan Cappadocia Green Tour'un bazı bölümleri çok uzun (örn. **1. bölüm: 1449 kelime / ~10 dk**). ElevenLabs çıktıları yüksek bitrate'de geldiğinde + birden fazla parça merge edildiğinde dosya **50 MB sınırını aşıyor** ve Storage **413 (Payload Too Large)** dönüyor.

İkincil sorun: `AddLanguageDialog.tsx` (satır 211) hata metnini sadece `"audio not available"` ifadesine göre eşleştiriyor. Storage'ın gerçek 413 hata gövdesi farklı olduğu için kullanıcıya yanlış/genel mesaj gösteriliyor: *"Storage temporarily unavailable"* — gerçek sebep "dosya çok büyük".

### Çözüm — 3 Adım

#### 1. Bucket dosya boyutu limitini yükselt (en kritik)
Migration ile `guide-audio` bucket'ının `file_size_limit` değerini **50 MB → 200 MB**'a çıkar. Diğer ses dosyaları (İngilizce orijinaller) zaten yüklendiğine göre uzun çevirileri de almalı.

```sql
UPDATE storage.buckets
SET file_size_limit = 209715200  -- 200 MB
WHERE id = 'guide-audio';
```

#### 2. İstemci tarafında ön doğrulama + akıllı hata mesajı
`src/components/AddLanguageDialog.tsx` → `handleAudioUpload`:
- Merge sonrası `blob.size` kontrolü: 200 MB üstündeyse upload denemeden önce kullanıcıya net mesaj göster ("Dosya çok büyük: X MB. ElevenLabs'te scripti 2 parçaya bölüp ayrı yükleyin.")
- Fetch fallback'inde 413 / "payload" / "too large" / "exceeded" anahtar kelimelerini de yakala ve kullanıcıya **gerçek sebebi** göster ("Bu bölüm dosyası çok büyük (X MB). Lütfen scripti bölüp tekrar deneyin.")
- "audio not available" özel branch'ini koru ama daha kapsamlı hale getir.

#### 3. UI'da bölüm uyarısı (opsiyonel ama faydalı)
Upload alanının yanında, kelime sayısı **>1200** olan bölümler için küçük bir uyarı rozeti: *"Uzun bölüm — gerekirse parça parça yükleyin (otomatik birleştirilir)"*. Mevcut multi-file merge zaten destekleniyor; sadece kullanıcıyı yönlendirmiş olur.

### Etkilenen Dosyalar
- **Yeni migration**: `guide-audio` bucket file_size_limit güncelleme
- `src/components/AddLanguageDialog.tsx` — `handleAudioUpload` (boyut ön kontrolü + 413 mesaj iyileştirmesi + uzun bölüm uyarısı)

### DOKUNULMAYACAKLAR
- ✅ Mevcut SDK + fetch fallback mantığı (sadece hata yakalama genişler)
- ✅ `mergeAudioFiles` mantığı
- ✅ Upload sonrası DB persist akışı
- ✅ Translation/resume mantığı
- ✅ MIME type listesi (zaten audio/mpeg destekleniyor)

### Doğrulama
1. Migration sonrası tekrar Fransızca yükle → 50 MB üstü dosya başarıyla yüklenmeli
2. Yapay olarak >200 MB dosya seç → net "dosya çok büyük" mesajı (upload denemesi olmadan)
3. Mevcut diğer dil yüklemeleri (Almanca, İspanyolca vb.) etkilenmiyor

### Notlar
- Çeviriler zaten DB'ye kaydedilmiş (resume mantığı var) — kullanıcı dialogu kapatıp tekrar açtığında kaldığı yerden audio yüklemeye devam edebilir.
- Yükselen limit Supabase global storage limitleri içinde kalıyor (ücretsiz plan dahil 50 MB üstüne izin verir; bucket-level override yeterli).

