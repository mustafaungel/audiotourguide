
## Plan: Tab Pill Başlık Kısaltmasını Kaldır

### Sorun
Dil seçicinin altındaki guide tab butonlarında (`MultiTabAudioPlayer.tsx` satır 336 ve 353) `truncate` class'ı kullanılıyor. Bu, uzun guide başlıklarını "Hot Air Balloon T..." ve "Cappadocia Val..." şeklinde kesiyor.

### Çözüm
`src/components/MultiTabAudioPlayer.tsx` dosyasında 2 yerde `truncate` → `line-clamp-2 break-words text-left` değişikliği:

- **Satır 336**: `<span className="truncate">` → `<span className="line-clamp-2 break-words text-left">`
- **Satır 353**: `<span className="truncate">` → `<span className="line-clamp-2 break-words text-left">`

Bu sayede başlıklar kesilmek yerine en fazla 2 satıra sarılır ve tam okunabilir olur.

### Etkilenen Dosya
- `src/components/MultiTabAudioPlayer.tsx` — 2 satır değişiklik
