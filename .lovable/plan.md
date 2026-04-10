

## Bug Fix: AutoCreateGuide ses listesini seçilen dile göre dinamik çekme

### Sorun
`AutoCreateGuide.tsx` satır 99'da `list-voices` edge function'ı sabit `{ language: 'english' }` ile çağrılıyor. Kullanıcı Türkçe veya Rusça seçse bile ses listesi hep İngilizce sesleri gösteriyor.

### Çözüm
`useEffect`'in dependency'sine `selectedLanguages[0]`'ı (primary language) ekle. Primary dil değiştiğinde `list-voices`'ı o dilin adıyla (`ELEVENLABS_LANGUAGES` lookup) tekrar çağır.

### Değişiklik

**`src/components/AutoCreateGuide.tsx`** — satır 94-111 arası:

```typescript
// Load voices when primary language changes
const primaryLangCode = selectedLanguages[0] || 'en';
const primaryLangNameForVoices = ELEVENLABS_LANGUAGES.find(l => l.code === primaryLangCode)?.name || 'English';

useEffect(() => {
  (async () => {
    setLoadingVoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-voices', { 
        body: { language: primaryLangNameForVoices } 
      });
      if (!error && data?.voices) {
        setVoices(data.voices);
        const firstFemale = data.voices.find((v: Voice) => v.gender === 'female');
        if (firstFemale) {
          setVoiceByLanguage(prev => ({ ...prev, [primaryLangCode]: prev[primaryLangCode] || firstFemale.voice_id }));
        }
      }
    } catch { /* silent */ }
    finally { setLoadingVoices(false); }
  })();
}, [primaryLangNameForVoices]);
```

Tek dosya, tek değişiklik. Artık dil seçildiğinde ElevenLabs'ten o dile uygun sesler gelecek.

