

## Plan: Dil Seçiminde Boyut/Konum Sabitliği

### Sorun
Collapsed modda `filteredLanguages` sadece 1 eleman içerdiğinden grid `grid-cols-1` oluyor ve buton tam genişliğe yayılıyor. Açık modda ise `grid-cols-2` olduğundan butonlar daha dar. Bu boyut/konum atlama yaratıyor.

### Çözüm
Grid class'ını her zaman **tüm dillerin sayısına** (`displayLanguages.length`) göre belirle, `filteredLanguages.length`'e göre değil. Gizlenen butonları DOM'dan kaldırmak yerine `hidden` class ile gizle. Böylece grid yapısı sabit kalır, seçili buton aynı boyut ve konumda durur.

### Değişiklik — `src/components/GuideLanguageSelector.tsx`

**1. Grid class'ını `displayLanguages` sayısına göre belirle (satır 114-116):**
```
displayLanguages.length === 2 ? "grid-cols-2" : displayLanguages.length >= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
```

**2. Tüm dilleri render et ama gizlenenlere `hidden` ekle (satır 118):**
```
{displayLanguages.map((language) => {
  const isSelected = language.language_code === selectedLanguage;
  const isHidden = collapsed && !isSelected;
  return (
    <button
      key={language.language_code}
      onClick={() => handleLanguageSelect(language.language_code)}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-200",
        "border active:scale-[0.97]",
        isSelected ? "bg-primary/10 border-primary text-primary shadow-sm ring-2 ring-primary/20"
                   : "bg-card border-border text-foreground hover:bg-muted",
        isHidden && "invisible"
      )}
    >
```

`invisible` kullanarak buton yer kaplar ama görünmez olur → seçili butonun grid pozisyonu ve boyutu değişmez.

**3. `filteredLanguages` değişkenini kaldır** — artık gerek yok.

### Etkilenen Dosya
- `src/components/GuideLanguageSelector.tsx` — ~5 satır değişiklik

