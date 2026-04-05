

## Plan: Bağlı Guide İçeriğini Bottom Sheet ile Açma

### Mevcut Durum
Bağlı guide tab'ına tıklanınca içerik inline olarak sayfada açılıyor, bu da sayfa kayması ve düzensizliğe neden oluyor.

### Çözüm
Bağlı guide'lara tıklanınca mevcut `BottomSheet` bileşenini kullanarak içeriği ekranın altından yarıya kadar açılan bir panel içinde göster. Ana guide (main) her zaman inline kalacak.

### Değişiklikler

#### `src/components/MultiTabAudioPlayer.tsx`
- Tab pill'lere tıklama davranışını değiştir:
  - `main` tab'ı mevcut gibi inline çalışsın
  - Linked guide tab'larına tıklanınca `BottomSheet` açılsın (`open` state + `selectedLinkedGuide` state)
- Tab pill'leri artık Radix `Tabs` yapısından çıkar, basit buton listesi olur (main her zaman aktif kalır)
- `BottomSheet` içinde: başlık + `NewSectionAudioPlayer` render edilir
- `BottomSheet` kapatılınca `selectedLinkedGuide` null olur, pill'deki active state kalkar
- Mevcut `forceMount` / `ResizeObserver` karmaşıklığı büyük ölçüde basitleşir çünkü linked guide içeriği artık ana akışta değil

#### Yapı (mobil):
```text
┌─────────────────────┐
│  [Main Guide] pill  │  ← her zaman aktif, inline player
│  [Linked 1]  pill   │  ← tıklayınca bottom sheet açar
│  [Linked 2]  pill   │  ← tıklayınca bottom sheet açar
├─────────────────────┤
│  Main guide chapters│  ← her zaman görünür
│  (inline player)    │
└─────────────────────┘

Bottom Sheet (açıldığında):
┌─────────────────────┐
│  ═══ drag handle ═══│
│  Linked Guide Title  X│
│  ─────────────────── │
│  Chapter 1           │
│  Chapter 2           │
│  Chapter 3           │
│  (scrollable)        │
└─────────────────────┘
```

### Etkilenen Dosya
- `src/components/MultiTabAudioPlayer.tsx` — tab yapısını pill buttons + bottom sheet'e dönüştür

### Beklenen Sonuç
- Ana guide içeriği her zaman yerinde, kayma yok
- Linked guide tıklanınca iOS-native bottom sheet açılır (yarı ekran)
- Kapatma butonu + sürükleyerek kapatma mevcut
- Layout shift problemi tamamen ortadan kalkar

