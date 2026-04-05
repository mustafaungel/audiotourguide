
## Plan: Pill Butonları Her Zaman Alt Alta Sırala

### Sorun
Şu anda `linkedGuides.length === 1` olduğunda grid `grid-cols-2` kullanılıyor (yan yana). Kullanıcı tüm durumlarda alt alta istiyor.

### Çözüm
`src/components/MultiTabAudioPlayer.tsx` satır 214'teki koşullu grid class'ını kaldır, her zaman `grid-cols-1` kullan:

```
- ${linkedGuides.length === 1 ? 'grid-cols-2' : 'grid-cols-1'}
+ grid-cols-1
```

Tek satır değişiklik. Tüm pill butonları (main + linked) her zaman alt alta sıralanır, başlıklar tam sığar.

### Etkilenen Dosya
- `src/components/MultiTabAudioPlayer.tsx` — 1 satır değişiklik
