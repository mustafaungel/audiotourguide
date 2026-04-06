

## Plan: Audio Access Sayfasında Kasma ve Geç İçerik Yükleme Düzeltmesi

### Problem

1. **Kasma/jank**: `NewSectionAudioPlayer` bileşeni key prop'unda dil kodu içeriyor (`${guideId}-${languageCode}`). Dil değiştiğinde tüm bileşen yıkılıp sıfırdan oluşturuluyor (remount) — bu audio element'i, state'i, resolved URL'leri hep sıfırlıyor ve mobilde belirgin kasma yaratıyor.

2. **İçerik geç geliyor**: Dil seçildiğinde `selectedLanguage` hemen güncelleniyor → key değişiyor → bileşen remount oluyor → ama yeni sections henüz fetch edilmedi → bileşen boş/eski sections ile açılıyor, sonra sections gelince tekrar güncelleniyor.

3. **Waterfall yükleme**: İlk açılışta `verifyAccess → detectLanguages → fetchSections → loadLinkedGuides` sıralı 4 adım var.

### Çözüm

#### 1. NewSectionAudioPlayer key'inden dil kodunu kaldır
Bileşen zaten `lastValidSectionsRef` ile eski sections'ı gösteriyor ve sections prop değişince güncelleniyor. Key'de dil olmasına gerek yok — sadece `guideId` yeterli.

**`MultiTabAudioPlayer.tsx`** — 2 yerde key değişikliği:
- Satır 232: `key={mainGuide.id}` (dil kodu kaldır)
- Satır 297: `key={selectedGuideId}` (dil kodu kaldır)

#### 2. Sections hazır olana kadar selectedLanguage'i güncelleme
**`AudioAccess.tsx`** — `handleLanguageChange` fonksiyonunda (satır 361-389):
- Önce fetch yap, sonra hem `setSections` hem `setSelectedLanguage` birlikte güncelle
- Bu sayede key değişmeden önce yeni sections hazır olur

```
const handleLanguageChange = async (languageCode: string) => {
  if (guideId) {
    const { data } = await supabase.rpc('get_sections_with_access', {
      p_guide_id: guideId, p_access_code: accessCode || '', p_language_code: languageCode
    });
    if (data && data.length > 0) {
      setSections(data);
    }
  }
  setSelectedLanguage(languageCode);  // State update at the end
};
```

#### 3. detectAvailableLanguages ve fetchSections'ı paralelize et
**`AudioAccess.tsx`** — `verifyAccessAndLoadGuide` içinde (satır 185):
- `detectAvailableLanguages` zaten sections fetch ediyor, ama sıralı waterfall
- Linked guides yüklemesi `MultiTabAudioPlayer` içinde zaten bağımsız çalışıyor, sorun yok
- Ana iyileştirme: `setGuide` ve `detectAvailableLanguages` arasında gereksiz bekleme yok, bu zaten doğru

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MultiTabAudioPlayer.tsx` | NewSectionAudioPlayer key'inden dil kodunu kaldır (2 yer) |
| `src/pages/AudioAccess.tsx` | `handleLanguageChange`'de önce fetch sonra state güncelle |

### Etki
- Dil değişiminde bileşen remount olmaz → kasma kalkar
- Sections hazır olana kadar eski içerik görünür → geç yükleme hissi ortadan kalkar
- Audio playback state korunur (kullanıcı çalarken dil değiştirirse audio kesilmez)

