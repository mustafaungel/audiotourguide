

## Plan: Dil Değişikliğinde Ses Dosyasının Güncellenmemesi

### Kök Sorun

`MultiTabAudioPlayer` içindeki `NewSectionAudioPlayer` bileşeninde **React key** dile bağlı değil. Dil değiştiğinde:

1. `sections` prop'u yeni dildeki bölümlerle güncelleniyor ✓
2. `lang` prop'u güncelleniyor ✓
3. **AMA** `NewSectionAudioPlayer` aynı component instance'ı kullanmaya devam ediyor
4. `audioRef.current` eski dildeki ses dosyasını çalmaya devam ediyor
5. `resolvedUrlsRef` güncellense de, zaten çalan `audioRef.current.src` değişmiyor

Karşılaştırma: `EnhancedAudioPlayer` bunu doğru yapıyor — `key={guide.id}-${selectedLanguage}-${sections.map(s => s.id).join('-')}` kullanarak dil değiştiğinde component'ı tamamen yeniden oluşturuyor.

### Çözüm — `src/components/MultiTabAudioPlayer.tsx`

`NewSectionAudioPlayer`'a dil ve section ID'lerini içeren `key` prop'u ekle. Bu sayede dil değiştiğinde React component'ı unmount edip yeniden mount eder, eski ses durur ve yeni dildeki bölümler yüklenir.

**3 yerde değişiklik:**

1. **Satır 220-225** — Linked guide yokken render edilen player:
```tsx
<NewSectionAudioPlayer
  key={`${mainGuide.id}-${languageByGuide[mainGuide.id] || languageCode}-${mainSections.map(s=>s.id).join(',')}`}
  guideId={mainGuide.id}
  ...
/>
```

2. **Satır 293-299** — BottomSheet içindeki player:
```tsx
<NewSectionAudioPlayer
  key={`${selectedGuideId}-${languageByGuide[selectedGuideId] || languageCode}-${getSheetSections().map(s=>s.id).