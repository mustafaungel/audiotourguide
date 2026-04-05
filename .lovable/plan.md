

## Plan: AudioAccess Tab Kayma Sorununu Kökten Çöz

### Sorunun Kök Nedeni
Tab değişiminde 3 şey aynı anda oluyor:
1. Eski `TabsContent` gizleniyor (yükseklik → 0)
2. Yeni `TabsContent` gösteriliyor (yükseklik → yeni değer)
3. `NewSectionAudioPlayer` `key` prop'u değiştiği için tamamen re-mount oluyor

Bu üçlü kombinasyon 1-2 frame'lik layout shift yaratıyor ve kullanıcı "kayma" görüyor.

---

### Çözüm: 3 Katmanlı Düzeltme

#### Değişiklik 1: `MultiTabAudioPlayer.tsx` — Content Container'a Sabit Min-Height
- `TabsContent` wrapper'ına `min-h-[400px]` ekle — tab içeriği değişirken yükseklik asla 0'a düşmez
- Daha da iyisi: aktif tab'ın yüksekliğini `ref` ile ölç ve container'a `style={{ minHeight }}` olarak uygula
- Bu tek başına kaymanın %80'ini çözer

#### Değişiklik 2: `MultiTabAudioPlayer.tsx` — Scroll Restore'u Güçlendir
- `requestAnimationFrame` yerine çift-frame approach: `rAF` içinde bir `rAF` daha — DOM'un gerçekten güncellenmesini bekle
- Ek olarak `window.scrollTo` yerine `{ behavior: 'instant' }` kullan — smooth scroll yapmasın

```typescript
onValueChange={(value) => {
  const scrollY = window.scrollY;
  setActiveTab(value);
  onActiveTabChange?.(value);
  // Double-rAF: wait for React render + DOM paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
  });
}}
```

#### Değişiklik 3: `MultiTabAudioPlayer.tsx` — Radix TabsContent forceMount
- `TabsContent` bileşenlerine `forceMount` prop ekle ve CSS ile gizle/göster
- Bu sayede tab değişiminde DOM'dan kaldırma/ekleme olmaz, sadece `visibility` değişir
- Layout reflow sıfırlanır

```typescript
<TabsContent value="main" forceMount className={activeTab !== 'main' ? 'hidden' : 'mt-0'}>
```

Bu approach ile:
- Tüm tab'lar DOM'da kalır, sadece `hidden` class ile gizlenir
- Yükseklik değişimi olmaz çünkü content zaten render edilmiş
- `NewSectionAudioPlayer` re-mount olmaz — audio playback bile korunur

---

### Etkilenen Dosya
- `src/components/MultiTabAudioPlayer.tsx` — 3 düzeltme (min-height + double-rAF + forceMount)

### Dokunulmayacak
- `NewSectionAudioPlayer.tsx`, `ChapterList.tsx` — ses logic'i
- `AudioAccess.tsx` — sayfa layout'u

