

## Plan: Dil Seçici Performans Düzeltmesi (AudioAccess + GuideDetail)

### Sorun
Videoda görülen kasma ve yavaşlık 3 kaynaktan geliyor — her ikisi de `GuideLanguageSelector` bileşenini kullanan AudioAccess ve GuideDetail sayfalarını etkiliyor:

1. **`transition-[max-height]` hâlâ aktif** (satır 127) — her frame'de layout recalculation tetikliyor
2. **Dil seçimi anında ağır Supabase RPC çağrısı başlatıyor** — UI thread bloklanıyor, animasyon takılıyor
3. **`NewSectionAudioPlayer` key'i tüm section ID'lerini içeriyor** — her dil değişiminde komple unmount/remount

### Çözüm

#### A. `GuideLanguageSelector.tsx` — max-height transition kaldır + rAF ile fetch ertele

**Satır 127**: `transition-[max-height] duration-300 ease-in-out` kaldırılacak. Konteyner anında boyut değiştirir, butonlardaki opacity/transform geçişi yeterli görsel yumuşaklık sağlar.

**Satır 64-78**: `handleLanguageSelect` içinde önce `setCollapsed(true)` çalışsın (animasyon başlasın), sonra `requestAnimationFrame` ile data fetch tetiklensin:

```tsx
const handleLanguageSelect = (languageCode: string) => {
  haptics.selection();
  if (languageCode === selectedLanguage && collapsed) {
    setCollapsed(false);
    return;
  }
  setCollapsed(true);
  requestAnimationFrame(() => {
    const isInMultiTab = !!activeGuideId;
    if (isInMultiTab) {
      window.dispatchEvent(new CustomEvent('changeGuideLanguage', {
        detail: { guideId: activeGuideId, languageCode }
      }));
    } else {
      onLanguageChange(languageCode);
    }
  });
};
```

#### B. `MultiTabAudioPlayer.tsx` — Key prop sadeleştirme

**Satır 303** ve **satır 240**: Section ID join'i kaldırılacak. Sadece `guideId + language`:

```tsx
key={`${selectedGuideId}-${languageByGuide[selectedGuideId] || languageCode}`}
```

Bu hem BottomSheet içindeki hem de no-linked-guides durumundaki `NewSectionAudioPlayer`'ı etkiler.

### Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/GuideLanguageSelector.tsx` | transition kaldır, rAF ekle (~5 satır) |
| `src/components/MultiTabAudioPlayer.tsx` | key prop sadeleştir (2 satır) |

### Beklenen Sonuç
- Dil seçiminde anında collapse animasyonu (kasma yok)
- Data fetch UI'ı bloklamaz
- Gereksiz player remount'ları önlenir
- Hem AudioAccess hem GuideDetail sayfalarında geçerli (aynı bileşenleri kullanıyorlar)

