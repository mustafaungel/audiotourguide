

## iPhone Tarzı Tema Toggle (Sun/Moon Switch)

### Mevcut Durum
- `next-themes` ile yönetiliyor — `attribute="class"`, `defaultTheme="light"`, `enableSystem`
- `ThemeToggle` 3 yerde kullanılıyor: `Navigation`, `AudioAccess`, `ExpandedPlayer`
- Şu an: 40x40 ghost button, Sun/Moon ikonları rotate/scale ile geçiş yapıyor — basit, premium hissi yok

### Yeni Tasarım — iOS Tarzı Animated Switch

**Görsel** (60x32 pill switch):
```
Light mode:               Dark mode:
┌──────────────────┐      ┌──────────────────┐
│ ☀️ ●           │      │           ● 🌙 │
└──────────────────┘      └──────────────────┘
gradient sky→amber        gradient indigo→slate
```

**Detaylar**:
- **Track**: `w-[60px] h-[32px] rounded-full`, gradient arka plan
  - Light: `from-amber-200 via-orange-200 to-sky-300` (gündüz/güneş)
  - Dark: `from-indigo-900 via-slate-800 to-slate-900` (gece/yıldız)
- **Thumb (knob)**: `w-[26px] h-[26px] rounded-full bg-white shadow-lg`
  - `transform translate-x-0` (light) → `translate-x-[28px]` (dark)
  - İçinde Sun (light) veya Moon (dark) ikonu — küçük (14px), renkli (amber-500 / slate-700)
  - Spring transition: `transition-transform duration-300 ease-spring`
- **Track içi süs**: 
  - Light modda sağda küçük bulut SVG (opacity-40)
  - Dark modda solda 2-3 küçük yıldız nokta (white, opacity-60)
- **Etkileşim**:
  - Hover: `scale-105`, shadow artışı
  - Active: `scale-95` (haptic-like)
  - `haptics.light()` çağrısı (mevcut `@/lib/haptics` kullanılarak)
- **Erişilebilirlik**: `role="switch"`, `aria-checked`, `sr-only` label

### Performans
Sadece `transform` ve `opacity` — GPU-accelerated, `mem://style/3d-depth-design` ve `mem://performance/animation-ux` ile uyumlu.

### Etkilenen Dosya
- `src/components/ThemeToggle.tsx` (tek dosya, ~50 satır)
- Diğer 3 kullanım noktası (Navigation, AudioAccess, ExpandedPlayer) otomatik olarak yeni tasarımı alır — değişiklik gerekmez

### Notlar
- `defaultTheme="light"` ve `enableSystem` korunur
- Boyut Navigation'daki 40x40 alanına sığar (60x32 pill)
- Mevcut layout'u bozmaz

