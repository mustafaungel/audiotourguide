

## Guide Kartı: Gerçekçi Kulaklık Silüeti Tasarımı

### Sorun
Mevcut tasarım keskin, düz ve mekanik görünüyor. Headband düz bir dikdörtgen, connector'lar ince çizgiler, ear cup'larla organik bir bağlantı yok. Gerçek bir over-ear kulaklığın zarif, kıvrımlı silüetini hissettiremiyor.

### Yeni Tasarım Yaklaşımı

Gerçek bir premium kulaklığın (Sony WH-1000XM5, AirPods Max gibi) önden görünümünü referans alarak:

```text
              ╭─────────────────────╮
            ╭─╯   Guide Başlığı     ╰─╮        ← ince, zarif kemerli headband
           │                            │
           │                            │       ← kıvrımlı side bands (border-radius ile)
          ╭╯                            ╰╮
     ╭────╯                              ╰────╮
    (  IMG  )    📍 Location · ⏱ 66min   ( ▶️  )  ← yuvarlak ear cups
     ╰─────╮                              ╭────╯
           ╰──────────────────────────────╯     ← alt cushion band
```

### Teknik Değişiklikler — `src/components/GuideCard.tsx`

1. **Headband**: `rounded-[50%_50%_0_0/40px...]` yerine SVG `path` veya daha ince/zarif CSS arch kullanmak. Headband'i daha ince yapıp (`py-1.5`), kemer eğrisini artırmak (`/60px`). Arka planı solid renk yerine hafif gradient + blur ile yumuşatmak.

2. **Side bands (connector)**: Düz çizgiler yerine, `border-left`/`border-right` ile kıvrımlı bir wrapper div kullanmak. Ear cup'ların dış kenarından headband'e doğru eğimli bağlantı — `border-radius` ile organik geçiş. Kalınlık 3px → 2px, renk daha soft (opacity azaltma).

3. **Ear cup'lar**: `rounded-[28px]` → `rounded-full` (tam daire) yaparak gerçek kulaklık hissi. Ring kalınlığını `ring-[3px]` → `ring-[2px]` yapıp daha ince ve zarif yapmak. Hafif `shadow-lg` ekleyerek derinlik hissi.

4. **Genel wrapper**: Tüm kartı saran bir container'a çok hafif bir arka plan (`bg-card/30`) ve `rounded-3xl` vererek silüetin bütünlüğünü artırmak. Veya side band'leri `before/after` pseudo-element yerine gerçek curved div'ler ile yapmak.

5. **Alt cushion**: Daha geniş ve yumuşak (`w-2/3`, `h-[2px]`, `opacity-30`) — kulaklığın alt yastığı hissi.

### Değişecek dosya
- **`src/components/GuideCard.tsx`** — headband ince/kemerli, side bands kıvrımlı, ear cups tam daire, genel silüet organik

