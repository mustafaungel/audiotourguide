

## Sticky Header: Kulaklık Kaldırma + Border Tutarsızlık Düzeltmesi

### 1. Kulaklık ikonunu kaldır
Satır 670'deki `<Headphones>` bileşeni silinecek — başlığa daha fazla alan açılacak.

### 2. Border tutarsızlığı düzeltmesi
İki görseldeki fark: birinde alt çizgi (border-b) belirgin, diğerinde neredeyse görünmüyor. Sorun `border-primary/15` opaklığının çok düşük olması — arkadaki içeriğe göre bazen görünüp bazen kayboluyormuş gibi duruyor.

**Çözüm:** `border-b` yerine `shadow-sm` veya daha belirgin bir border opaklığı (`border-primary/25`) kullanarak tutarlı görünüm sağlamak. Featured için de `border-amber-500/30` yapılacak.

### Değişiklik — `src/pages/GuideDetail.tsx`

**Satır 665:** Border opaklığını artır
```
Önce:  border-amber-500/20 ... border-primary/15
Sonra: border-amber-500/30 ... border-primary/25
```

**Satır 670:** Headphones satırını tamamen sil

Tek dosya, 2 satır değişikliği.

