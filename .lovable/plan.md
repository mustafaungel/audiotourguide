

## Düzeltme: LiveListenersBadge Renk Taşması

### Problem

Badge'in dış katmanı gradient border (`from-primary/20 via-primary/5 to-primary/20`) ve iç katman `bg-card/60` (yarı saydam). Yarı saydam arka plan, altındaki gradient'in sağ tarafta "now" kelimesinden sonra görünmesine neden oluyor — renk taşması efekti.

### Çözüm

İç div'in arka plan opaklığını `bg-card/60` → `bg-card` (tam opak) yaparak gradient border'ın sadece 1px kenarlık olarak görünmesini sağla. `backdrop-blur-xl saturate-150` efektleri bu durumda gereksiz kalacağı için kaldırılabilir.

### Teknik

```
src/components/LiveListenersBadge.tsx (satır 36)

Önce:  bg-card/60 backdrop-blur-xl saturate-150
Sonra: bg-card backdrop-blur-sm
```

Tek satır değişikliği — iç arka plan tam opak olunca gradient sadece 1px border olarak kalır, taşma olmaz.

