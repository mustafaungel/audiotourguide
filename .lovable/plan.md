

## Tüm Sistemde Gerçek Dinleyici Sayısının Eşitlenmesi

### Problem
- AudioAccess'te gerçek Presence verisi var ama GuideCard'lara (ana sayfa, browse, country) yansımıyor
- Kullanıcı AudioAccess'te dinlerken, ana sayfadaki badge hâlâ sadece sahte sayıyı gösteriyor

### Çözüm
`LiveListenersBadge` bileşeninin kendisi Presence'a abone olsun — böylece nerede kullanılırsa kullanılsın gerçek veriyi gösterir.

### Değişiklikler

**1. `src/components/LiveListenersBadge.tsx`**
- İçinde `usePresenceTracker(guideId)` çağrısı ekle
- Dışarıdan gelen `realCount` prop'una artık gerek yok — badge kendi Presence verisini alır
- `useLiveListeners(guideId, presenceCount)` şeklinde birleştirir

**2. `src/pages/AudioAccess.tsx`**
- `usePresenceTracker` import'u ve `realCount` prop geçişi kaldırılır (artık badge kendi halleder)

### Sonuç
- Her yerde aynı sayı: GuideCard, AudioAccess, GuideDetail — hepsi base + real gösterir
- AudioAccess'te kullanıcı dinliyorsa, ana sayfadaki aynı rehberin badge'i de güncellenir
- Performans: GuideCard başına 1 hafif WebSocket (read-only, sıfır DB yazma)
- Visible card sayısı 6 ile başladığı için başlangıçta sadece 6 bağlantı

2 dosya değişikliği, net sadeleşme.

