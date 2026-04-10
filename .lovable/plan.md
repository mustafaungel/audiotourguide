

## Topkapı Sarayı Audio Guide Oluşturma Sorunları ve Çözüm

### Tespit Edilen Sorunlar

Session replay ve edge function loglarından analiz:

1. **18 bölüm planlandı** — Topkapı Sarayı için `plan-guide-sections` 18 bölüm çıkardı. Her bölüm için sırasıyla script üretimi (~7s) + audio üretimi (~30s) yapılıyor. Toplam: ~11 dakika sadece İngilizce audio için.

2. **Section 9'da hata** — 8 bölümün audiosu başarıyla üretildi (loglardan doğrulandı), section 9 için edge function çağrısı yapıldı ama yanıt gelmedi (shutdown logları var, error logu yok). Bu, **edge function timeout** (Supabase free tier: 150s, paid: 400s) veya ElevenLabs API rate limit olasılığını gösteriyor.

3. **Retry mekanizması yok** — Tek bir bölüm başarısız olunca `throw new Error()` ile tüm süreç iptal ediliyor, daha önce başarıyla üretilen 8 audio da boşa gidiyor.

4. **Sıralı (sequential) işlem** — Tüm audio'lar birer birer üretiliyor, paralel işlem yok.

### Çözüm

**3 dosyada değişiklik:**

#### 1. `src/components/AutoCreateGuide.tsx` — Audio üretim döngüsüne retry + parallelism ekle

- **Retry mantığı**: Her audio üretimi için 2 retry denemesi ekle (toplam 3 deneme). Araya 3 saniye bekleme koy (rate limit koruması).
- **Hata toleransı**: Tek bir bölüm başarısız olursa tüm süreci iptal etme, o bölümü "failed" olarak işaretle ve devam et. Sonunda kullanıcıya kaç bölümün başarısız olduğunu göster.
- **2'li paralel üretim**: Aynı anda 2 audio üretimi başlat (ElevenLabs rate limit'e takılmamak için 2 ile sınırla).

```typescript
// Retry helper
const generateAudioWithRetry = async (text, voiceId, maxRetries = 2) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { text, voiceId, modelId: 'eleven_multilingual_v2' }
      });
      if (!error && data?.audio_url) return data;
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 3000));
    } catch { 
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return null; // Failed after retries
};

// 2'li paralel batch üretimi
for (let i = 0; i < sections.length; i += 2) {
  const batch = sections.slice(i, i + 2);
  const results = await Promise.all(batch.map(...));
  // ...
}
```

#### 2. `supabase/functions/generate-audio/index.ts` — Script uzunluk limitini artır

- Mevcut limit 5000 karakter — bazı detaylı bölümler bunu aşabiliyor
- **Limiti 8000 karaktere çıkar** (ElevenLabs API'si 5000+ karakteri destekliyor)

#### 3. `supabase/functions/plan-guide-sections/index.ts` — Bölüm sayısını makul tut

- Mevcut prompt "15-25 sections" diyor — bu çok fazla audio üretim süresi demek
- **Maksimum 12 bölümle sınırla**: prompt'u "8-12 sections for major sites, 4-8 for smaller ones" olarak güncelle
- Bu tek başına süreyi ~%40 azaltır

### Özet

| Sorun | Çözüm | Etki |
|-------|-------|------|
| 18 bölüm = 11+ dk | Maks 12 bölüm | ~%40 hız artışı |
| Sıralı audio üretimi | 2'li paralel batch | ~%50 hız artışı |
| Tek hata = tümü iptal | Retry + hata toleransı | Güvenilirlik |
| 5000 char script limiti | 8000 char'a çıkar | Uzun script desteği |

