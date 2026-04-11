
## GuideCard'lardaki "listening" badge'ini Guide Detail ile aynı stile güncelle

### Problem
- GuideCard'larda `variant="inline"` kullanılıyor → sadece düz metin, kulaklık ikonu + "XX listening"
- GuideDetail ve AudioAccess'te `variant="badge"` kullanılıyor → gradient border pill, equalizer animasyonu, premium görünüm
- Kullanıcı tüm sayfalarda aynı badge stilini istiyor

### Çözüm
GuideCard'daki `variant="inline"` kullanımını kaldırıp default `badge` varyantını kullan. Ancak kart içinde badge varyantı çok büyük kalacağından, badge varyantına `compact` boyut desteği ekle.

### Teknik detay

**`src/components/LiveListenersBadge.tsx`**
- Yeni prop ekle: `size?: 'default' | 'compact'`
- `compact` boyutta: daha küçük font (`text-[9px]`), daha küçük padding (`px-2 py-1`), küçük equalizer (`small`), küçük ikon (`w-2.5 h-2.5`)
- `inline` varyantı tamamen kaldırılacak — artık her yerde badge varyantı kullanılacak

**`src/components/GuideCard.tsx`**
- `variant="inline"` → kaldır
- `size="compact"` ekle → kart içinde sığacak boyutta premium pill badge

### Beklenen sonuç
- Tüm sayfalarda aynı gradient-border pill + equalizer animasyonlu badge
- Kart içinde kompakt ama aynı estetik
- Tutarlı marka deneyimi
