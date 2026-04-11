

## Konum Badge'den Kısaltmayı Kaldırma

### Problem
Görselin içindeki konum badge'inde `truncate` class'ı var, bu yüzden "Cappadocia, Turk..." gibi kesilmiş metin görünüyor.

### Çözüm — `src/pages/GuideDetail.tsx` (satır 698-701)

Konum span'ından `truncate` kaldırılacak, metin uzunsa alt satıra geçecek şekilde `break-words` eklenecek:

```tsx
// Önce:
<span className="truncate">{guide.location}</span>

// Sonra:
<span className="break-words">{guide.location}</span>
```

Ayrıca parent span'daki `inline-flex` yerine `flex` kullanılacak ve `flex-wrap` eklenecek ki metin düzgün sarılsın. `right-1.5` korunacak böylece metin görselin dışına taşmaz.

Tek dosya, 1 satır değişikliği.

