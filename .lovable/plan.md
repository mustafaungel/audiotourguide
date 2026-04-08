

## Plan: Dil Değişiminde Anında Geçiş — Sıfır Gecikme Hissi

### Problem
Dil butonuna tıklandığında bayrak ve içerik gecikmeli güncelleniyor çünkü mevcut akış:
1. Kullanıcı dile tıklar → `handleLanguageChange` çağrılır
2. Supabase RPC ile yeni dil section'ları fetch edilir (ağ bekleme)
3. Fetch tamamlanınca `setSections` + `setSelectedLanguage` güncellenir

Bu sırada kullanıcı eski bayrağı/içeriği görmeye devam eder → "sonradan değişiyor" hissi.

### Çözüm Stratejisi: 3 Katmanlı Optimizasyon

#### 1. Sayfa Seviyesi Section Cache (AudioAccess.tsx)
- `sectionsByLang` adında `Record<string, Section[]>` cache ekle
- Her fetch edilen dil sonucu cache'e yaz
- Dil değiştiğinde önce cache'e bak → varsa anında göster, fetch atma
- İlk yüklemede mevcut dili cache'e yaz

#### 2. Optimistik State Güncellemesi (AudioAccess.tsx)
- `setSelectedLanguage(languageCode)` → fetch'ten ÖNCE çağır (bayrak anında değişir)
- Cache'de varsa `setSections(cached)` anında → sıfır gecikme
- Cache'de yoksa eski section'ları göstermeye devam et + arka planda fetch at
- Fetch tamamlanınca `setSections` + cache güncelle

#### 3. Arka Plan Prefetch (AudioAccess.tsx)
- `detectAvailableLanguages` tamamlandıktan sonra, diğer dilleri arka planda prefetch et
- `requestIdleCallback` veya `setTimeout(fn, 1000)` ile ana thread'i bloklama
- Prefetch edilen section'lar cache'e yazılır → sonraki dil değişimi anında olur

### Teknik Değişiklikler

**`src/pages/AudioAccess.tsx`:**

```typescript
// Yeni state
const [sectionsByLang, setSectionsByLang] = useState<Record<string, any[]>>({});

// handleLanguageChange — optimistik
const handleLanguageChange = async (languageCode: string) => {
  // 1. Bayrak anında değişir
  setSelectedLanguage(languageCode);
  
  // 2. Cache'de varsa anında göster
  if (sectionsByLang[languageCode]) {
    setSections(sectionsByLang[languageCode]);
    return; // Ağ isteği yok → anında
  }
  
  // 3. Cache'de yoksa arka planda fetch
  const { data } = await supabase.rpc('get_sections_with_access', { ... });
  if (data?.length > 0) {
    setSections(data);
    setSectionsByLang(prev => ({ ...prev, [languageCode]: data }));
  }
};

// detectAvailableLanguages sonrası prefetch
const prefetchOtherLanguages = (languages, currentLang) => {
  const others = languages.filter(l => l.language_code !== currentLang);
  const prefetchNext = (i) => {
    if (i >= others.length) return;
    setTimeout(async () => {
      const { data } = await supabase.rpc('get_sections_with_access', { ... });
      if (data?.length > 0) {
        setSectionsByLang(prev => ({ ...prev, [others[i].language_code]: data }));
      }
      prefetchNext(i + 1);
    }, 500); // Her dil arası 500ms — bant genişliğini ezme
  };
  prefetchNext(0);
};
```

**`src/components/NewSectionAudioPlayer.tsx`:**
- `lastValidSectionsRef` zaten var — cache boşken eski section'lar gösterilir → flash yok

### Dokunulmayacaklar
- GuideLanguageSelector UI — zaten optimistik collapse yapıyor
- MultiTabAudioPlayer — kendi `sectionCache` Map'i ile bağlı rehberleri yönetiyor
- Audio playback, payment flow, auth — sıfır değişiklik

### Dosya

| Dosya | Değişiklik |
|-------|-----------|
| `src/pages/AudioAccess.tsx` | Section cache, optimistik state, arka plan prefetch |

Tek dosya değişikliği. Mevcut `fetchSectionsForLanguage` fonksiyonu cache-aware hale getirilir, `handleLanguageChange` optimistik güncelleme yapar, `detectAvailableLanguages` sonrası prefetch başlatılır.

