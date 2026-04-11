

## Guide Kartı Kulaklık Tasarımı İyileştirmesi

### Sorunlar (Ekran görüntüsünden)
1. **Kenarlar boş** — ear cup'lar ve headband arasında kulaklık silüetini tamamlayan kenar çizgileri yok. Kartın sol ve sağ kenarları düz ve boş kalıyor.
2. **Başlıklar kesiliyor** — `line-clamp-1` ve `max-w-[80%]` yüzünden uzun başlıklar "..." ile kırpılıyor.
3. **Headband'deki kulaklık ikonu gereksiz** — kart zaten kulaklık şeklinde, `<Headphones>` ikonu fazlalık.

### Çözüm

**`src/components/GuideCard.tsx`**

1. **Kenar bantları ekle** — Headband'den ear cup'lara inen dikey kenar çizgileri. Connector bölümünü uzatıp, ear cup'ların dış kenarlarında dikey bantlar oluşturacak şekilde `border-left` / `border-right` veya ince div'ler eklemek. Ana body bölümünün sol ve sağında 3px genişliğinde, yukarıdan aşağı uzanan bantlar olacak → kulaklık silüetinin "band" kısmını tamamlayacak.

2. **Başlık tam gösterilsin** — `line-clamp-1` → `line-clamp-2` yapılacak, `max-w-[80%]` kaldırılacak. Başlık iki satıra kadar rahatça sığacak.

3. **Kulaklık ikonu kaldırılsın** — `<Headphones>` import ve kullanımı headband'den çıkarılacak.

### Teknik Detay

```text
Yapı (güncelleme sonrası):

          ╭──────────────────────────╮
         ╱  Cappadocia: Discover      ╲
        ╱   Hidden Valleys             ╲
       │                                │
       │                                │   ← dikey bant çizgileri
  ╭────┤                                ├────╮
  │    │                                │    │
  │IMG │   📍 Location                  │ ▶  │
  │    │   ⏱ 66 min                    │    │
  │    │   🎧 56 listening              │    │
  ╰────┤                                ├────╯
       └────────────────────────────────┘
```

Connector bölümü yerine, ear cup'ları saran bir wrapper div'e sol/sağ border eklenecek. Bu border headband'ın alt kenarından ear cup'ların üst kenarına kadar uzanacak → gerçek kulaklık bant silüeti.

### Değişecek dosya
- **`src/components/GuideCard.tsx`** — 3 değişiklik (kenar bantları, başlık clamp, ikon kaldırma)

