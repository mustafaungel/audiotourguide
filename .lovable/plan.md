

## Sticky Header'lara Cam (Glass) Efekti Uygula

### Problem
Sticky header'lar şu anda opak veya yarı-opak arka plan kullanıyor. Kullanıcı tüm sticky header'larda tutarlı bir cam/glass efekti istiyor.

### Etkilenen yerler (3 adet)

| Dosya | Satır | Mevcut |
|-------|-------|--------|
| `Navigation.tsx` | 41 | `bg-background/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60` — zaten cam efekti var ✓ |
| `GuideDetail.tsx` | 665 | Featured: `bg-amber-950/95` / Normal: `bg-background` — opak, cam efekti yok ✗ |
| `AudioAccess.tsx` | 700 | `bg-background/95` — hafif şeffaf ama backdrop-blur yok ✗ |

### Çözüm

Navigation bileşeni zaten doğru cam efektine sahip. Diğer iki sticky header'ı aynı mantığa uyduracağız:

**`GuideDetail.tsx` (satır 665)**
```
Önce:  bg-amber-950/95 dark:bg-amber-950/95 : bg-background
Sonra: bg-background/70 backdrop-blur-xl border-b border-border/30
       (featured: bg-amber-950/70 backdrop-blur-xl)
```

**`AudioAccess.tsx` (satır 700)**
```
Önce:  bg-background/95 border-b border-border/30 shadow-sm
Sonra: bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-sm
```

### Cam efekti formülü (tutarlı)
Tüm sticky header'lar şu pattern'i kullanacak:
- `bg-background/70` (veya tematik renk `/70`) — %30 şeffaflık
- `backdrop-blur-xl` — arkadaki içeriği bulanıklaştırma
- `border-b border-border/30` — ince alt kenarlık
- Mevcut `shadow-sm` varsa korunacak

### Değişecek dosyalar
1. `src/pages/GuideDetail.tsx` — sticky header class'ları
2. `src/pages/AudioAccess.tsx` — sticky header class'ları

Navigation zaten cam efektine sahip, dokunulmayacak.

