

## ElevenLabs Ses Listesini İyileştirme

### Sorun
1. `list-voices` edge function eski `/v1/shared-voices` endpoint'ini kullanıyor — bu endpoint `search` parametresiyle metin araması yapıyor, dil bazlı filtreleme yok
2. Kalite filtresi yok — düşük kaliteli/az kullanılan sesler de listeleniyor
3. Sonuç olarak seçilen dile uygun olmayan veya kalitesiz sesler gösteriliyor

### Çözüm

**`supabase/functions/list-voices/index.ts`** tamamen yeniden yazılacak:

1. **Yeni API endpoint**: `/v1/shared-voices` yerine `/v1/shared-voices` endpoint'inin `language` ve `sort` parametrelerini kullanarak dile göre filtreleme yap (ElevenLabs shared-voices API'si `language` parametresini destekliyor — şu an sadece `search` kullanılıyor)
2. **Kalite filtresi**: Dönen sesleri `usage_character_count` veya `cloned_by_count` (kullanım sayısı) bazında filtrele — minimum 1000+ kullanımı olan sesleri getir. Bu, topluluk tarafından kanıtlanmış kaliteli sesleri garantiler
3. **Sıralama**: `usage_character_count` veya popülerliğe göre azalan sıra ile en kaliteli sesleri üste getir
4. **Premade sesler**: Hesaptaki kendi/premade sesler (multilingual) her zaman listenin başında ★ ile gösterilmeye devam edecek
5. **Sayfa boyutu**: 50 ile sınırla (100 yerine) — kalite filtresi sayesinde daha az ama daha iyi sonuçlar

### Değişiklikler

| Dosya | Değişiklik |
|-------|-----------|
| `supabase/functions/list-voices/index.ts` | Shared voices API çağrısını `language` parametresi ile filtrele, `sort=trending` veya kullanım sayısına göre sırala, düşük kaliteli sesleri (`usage_character_count < 1000`) filtrele |

### Teknik Detay

```typescript
// Shared voices API — dil filtreli, popülerliğe göre sıralı
const sharedParams = new URLSearchParams({
  page_size: '50',
  sort: 'trending',        // En popüler sesler önce
  language: language || '', // Dil bazlı filtreleme
});

// Kalite filtresi — sadece 1000+ kullanımlı sesler
sharedVoices = rawVoices.filter(v => 
  (v.usage_character_count || 0) >= 1000 || 
  (v.cloned_by_count || 0) >= 50
);
```

TTS tarafı zaten `eleven_multilingual_v2` (en güncel multilingual model) kullanıyor — değişiklik gerekmez.

