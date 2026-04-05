

## Plan: Dil Seçimi Konum Sabitliği + Main Guide Pill Düzeltmesi

### Sorun 1: Dil Buton Konumu Kayıyor
Görsellerde görüldüğü gibi, Japonca (sağ üst köşede) seçildiğinde sol üst köşeye kayıyor. `hidden` ile gizlenen önceki butonlar DOM'dan çıktığı için flex-wrap sıralama değişiyor.

### Çözüm 1: `hidden` yerine `invisible` + container yüksekliğini animasyonla daralt
- Butonlara `hidden` yerine `invisible` uygula → konum sabit kalır
- Container'a `max-height` animasyonu ekle: collapsed ise sadece ilk satırın yüksekliği kadar, değilse tam yükseklik
- Seçili butonun satır pozisyonunu hesapla: eğer seçili buton 2. satırdaysa, 1. satırı gizle ve 2. satırı yukarı kaydır

**Daha basit yaklaşım:** Tüm butonları her zaman render et. Collapsed modda seçili olmayan butonları `opacity-0 pointer-events-none h-0 min-h-0 overflow-hidden m-0 p-0 border-0` ile görünmez ve sıfır yükseklikte yap. Böylece seçili buton grid/flex içinde aynı sütun pozisyonunu korur ama diğer satırlar çöker.

**En temiz yaklaşım:** Grid layout'u koru. Collapsed modda gizlenen butonlara `invisible` uygula (konum sabit). Ama container'ın `overflow-hidden` + dinamik `max-height` ile sadece seçili butonun bulunduğu satırı göster, alttaki satırlar clip edilir → içerik yukarı kayar.

### Değişiklik — `src/components/GuideLanguageSelector.tsx`

1. **Grid layout'a geri dön** — `flex flex-wrap` yerine `grid grid-cols-2` kullan
2. **Gizleme:** `hidden` yerine `invisible` — butonlar yer kaplar ama görünmez
3. **Container'a dinamik max-height:** Seçili butonun satır indexini hesapla (`Math.floor(selectedIndex / 2)`), collapsed modda `max-height` sadece o satırı + üstünü kapsayacak şekilde ayarla (ör: `(rowIndex + 1) * 52px`)
4. **`overflow-hidden` + `transition-[max-height]`** ile alt satırlar smooth şekilde gizlenir, içerik yukarı kayar

### Sorun 2: Main Guide Pill Her Zaman Aktif
Main guide butonu her zaman `bg-primary text-primary-foreground` ile sabit. Drawer kapalıyken bu doğru ama kullanıcı bunu tıklayamıyor/toggle edemiyor.

### Çözüm 2: Main guide pill'e de aynı toggle mantığı
- Main guide butonu: drawer kapalıysa aktif stil, drawer açıksa (linked guide seçiliyse) pasif stil → bu zaten linked guide butonlarındaki `isSelected` mantığıyla çalışıyor
- Şu anki kodda main guide her zaman aktif stil alıyor. Bunu `!sheetOpen` koşuluna bağla.

### Değişiklik — `src/components/MultiTabAudioPlayer.tsx`

Main guide butonunun class'ını conditional yap:
```
const isMainActive = !sheetOpen;
className={cn(
  "flex items-center ... rounded-xl transition-all active:scale-[0.97]",
  isMainActive
    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
    : "bg-muted/50 hover:bg-muted"
)}
```

### Etkilenen Dosyalar
- `src/components/GuideLanguageSelector.tsx` — grid + overflow-hidden + max-height animasyonu
- `src/components/MultiTabAudioPlayer.tsx` — main guide pill conditional styling

### Sonuç
- Dil seçildiğinde buton aynı grid pozisyonunda kalır (konum değişmez)
- Container yüksekliği daralır, alttaki içerik yukarı kayar (overflow clip)
- Main guide pill, drawer açıkken pasif stile döner

