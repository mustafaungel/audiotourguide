

## Live Listeners: 60 Dakika Aralık + Gerçek Dinleyici Takibi

### Mevcut Durum
- Sahte sayaç her 5 dakikada güncelleniyor (deterministik hash)
- Gerçek dinleyici verisi yok

### Yaklaşım: Supabase Realtime Presence (Sıfır DB Yazma)

Supabase'in Presence özelliği kullanılacak — WebSocket üzerinden çalışır, veritabanına hiçbir şey yazmaz. AudioAccess sayfasını açan kullanıcı otomatik olarak o rehberin "odasına" katılır, sayfadan çıkınca otomatik ayrılır.

### Değişiklikler

**1. `src/hooks/useLiveListeners.ts`** — Interval 60 dakikaya, opsiyonel gerçek sayı desteği
- `300000` → `3600000` (60 dakika)
- `realCount` parametresi ekle: varsa base + real toplam döner

**2. `src/hooks/usePresenceTracker.ts`** (yeni dosya)
- AudioAccess sayfasında kullanılacak hook
- `supabase.channel('listeners:{guideId}')` ile presence kanalına katılır
- `presenceState` ile o anda kaç kişi dinlediğini döner
- Sayfa kapandığında (cleanup) kanaldan otomatik ayrılır
- Toplam DB yükü: **sıfır** — tamamen WebSocket

**3. `src/pages/AudioAccess.tsx`** — Presence tracker'ı bağla
- `usePresenceTracker(guideId)` çağrısı ekle
- `LiveListenersBadge`'e `realCount` prop'u geç

**4. `src/components/LiveListenersBadge.tsx`** — realCount prop desteği
- Opsiyonel `realCount` prop kabul et
- `useLiveListeners(guideId, realCount)` şeklinde ilet

### Sonuç
- GuideCard'larda (ana sayfa, browse): sadece base hash (60dk güncelleme, DB sorgusu yok)
- AudioAccess'te: base hash + gerçek dinleyici sayısı (Presence WebSocket)
- Performans etkisi: sıfır DB yazma, sadece hafif WebSocket bağlantısı

3 dosya değişikliği, 1 yeni dosya.

