

## Plan: Bağlı Rehberlerde BottomSheet → Accordion/Dropdown Geçişi

### Problem
Bağlı audio guide'larda pill butonuna tıklayınca BottomSheet (alttan açılan panel) açılıyor. Bu mobilde MiniPlayer konumlandırma sorunlarına yol açıyor ve kullanıcı deneyimini karmaşıklaştırıyor.

### Çözüm
BottomSheet'i kaldırıp, her pill butonunun tıklandığında **inline olarak aşağı doğru açılan** (collapsible/accordion) bir yapıya geçiş yapılacak. Standalone guide ile aynı mantık — sadece başlangıçta kapalı, tıklayınca içerik açılacak.

### Görsel Akış
```text
Kapalı hali:
┌──────────────────────────────────┐
│ ♫  Cappadocia : Introduction   ▼ │  ← tıklanabilir, chevron aşağı
├──────────────────────────────────┤
│ ♫  Cappadocia Valleys          ▼ │
└──────────────────────────────────┘

Açık hali (Introduction tıklandı):
┌──────────────────────────────────┐
│ ♫  Cappadocia : Introduction   ▲ │  ← aktif, chevron yukarı
│  ┌────────────────────────────┐  │
│  │ 🎧 Up Next                │  │
│  │ 1. ATV Tour Introduction  │  │
│  │    1:02                    │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│ ♫  Cappadocia Valleys          ▼ │  ← kapalı
└──────────────────────────────────┘
```

### Teknik Değişiklikler

**`src/components/MultiTabAudioPlayer.tsx`:**
- `BottomSheet` import ve kullanımını kaldır
- `sheetOpen` state'ini kaldır, `selectedGuideId` tek başına açık/kapalı kontrolü yapar (toggle mantığı)
- Pill butonuna tıklayınca: zaten açıksa kapat, kapalıysa aç + section'ları yükle
- `ChevronRight` → `ChevronDown`/`ChevronUp` (açık/kapalı duruma göre)
- Her pill'in altında `selectedGuideId === guide.id` ise `NewSectionAudioPlayer` inline render et (animasyonlu açılma)
- `insideSheet={false}` olarak geçir (artık sheet yok)
- Açık olan pill'e görsel vurgu (arka plan rengi, border)

**`src/components/NewSectionAudioPlayer.tsx`:**
- `insideSheet` prop'u artık kullanılmayacak (hep false gibi davranacak)
- MiniPlayer her zaman normal fixed konumda render edilecek — portal karmaşıklığı ortadan kalkar

**Tıklanabilirlik göstergesi:**
- Pill butonlarında `ChevronDown` ikonu ile "tıkla ve aç" mesajı verilir
- Açıkken `ChevronUp` olur
- Hover/active efektleri korunur
- `active:scale-[0.97]` animasyonu zaten mevcut

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MultiTabAudioPlayer.tsx` | BottomSheet → inline accordion, toggle mantığı, chevron yönü |
| `src/components/NewSectionAudioPlayer.tsx` | insideSheet portal mantığını sadeleştir |

