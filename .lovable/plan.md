

## Plan: Linked Guide'ların Dil Değişikliğini Takip Etmemesi

### Sorun

`MultiTabAudioPlayer.tsx` satır 65-67'de, `languageCode` prop'u değiştiğinde sadece **main guide** için `languageByGuide` güncelleniyor:

```tsx
useEffect(() => {
  setLanguageByGuide(prev => ({ ...prev, [mainGuide.id]: languageCode }));
}, [languageCode, mainGuide.id]);
```

Linked guide'lar bu güncellemeye dahil edilmiyor. Kullanıcı Çince seçtiğinde:
- Main guide → `languageByGuide[mainGuide.id]` = `'zh'` ✓
- Goreme Open Air Museum → `languageByGuide[guideId]` = `undefined` → fallback `languageCode` prop'u kullanılıyor

**AMA** `ensureGuideSections` fonksiyonunda (satır 112):
```tsx
if (!overrideLanguage && sectionsByGuide[guideId]?.length > 0) return;
```
Linked guide daha önce İngilizce ile yüklenmiş ve cache'lenmiş — bu kontrol yüzünden yeni dilde tekrar yükleme yapılmıyor.

DB'de tüm linked guide'ların Çince bölümleri mevcut (Goreme: 10, Pasabag: 7, Kaymakli: 14).

### Çözüm — `src/components/MultiTabAudioPlayer.tsx`

**1. `languageCode` prop'u değiştiğinde tüm guide'ların dilini güncelle**

Satır 65-67'deki useEffect'i genişlet:

```tsx
useEffect(() => {
  setLanguageByGuide(prev => {
    const updated: Record<string, string> = { [mainGuide.id]: languageCode };
    linkedGuides.forEach(g => { updated[g.guide_id] = languageCode; });
    return { ...prev, ...updated };
  });
  // Linked guide section'larını yeni dilde yeniden yükle
  linkedGuides.forEach(g => {
    ensureGuideSections(g.guide_id, languageCode);
  });
}, [languageCode, mainGuide.id]);
```

Bu sayede:
- Tüm guide'ların dili aynı anda güncellenir
- Cache bypass edilir (`overrideLanguage` parametresi ile)
- BottomSheet açıldığında doğru dildeki bölümler zaten yüklenmiş olur

### Yayınlamadan Test Etme Hakkında

Lovable'da frontend değişiklikleri ancak "Publish > Update" butonuna tıklayınca canlıya çıkar. Preview URL'si (`id-preview--*.lovable.app`) ile test edebilirsiniz ama bu URL'ye erişim için Lovable hesabı gerekiyor. Herkese açık geçici link oluşturmak için **Share > Share preview** kullanılabilir (7 gün geçerli). Backend değişiklikleri (edge functions, migration'lar) ise otomatik olarak hemen deploy edilir.

### Etkilenen Dosya
- `src/components/MultiTabAudioPlayer.tsx` — 1 useEffect değişikliği (~8 satır)

