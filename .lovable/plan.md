

## Expanded Player Script — Drop Cap + Divider Tasarımı

### Değişiklik — `src/components/ExpandedPlayer.tsx` (ScriptReadingView)

Mevcut düz paragraf yapısını premium bir okuma deneyimine dönüştüreceğim:

**1. Drop Cap (İlk Harf Büyük)**
- Her paragrafın ilk harfi `text-[3rem]`, `font-bold`, `float-left`, `leading-none`, `text-foreground` — klasik kitap stili
- Geri kalan metin etrafında doğal şekilde akar
- İlk harf için hafif `text-primary/80` renk tonu — accent ile uyumlu

**2. Paragraf Ayırıcı (Divider)**
- Paragraflar arasında ortalanmış ince dekoratif ayırıcı: `· · ·` (üç nokta) veya ince `<hr>` çizgi
- `text-muted-foreground/30` ile hafif ve zarif
- Son paragraftan sonra ayırıcı yok

**3. Tipografi İyileştirmeleri**
- Font boyutu `16px` → `17px` — biraz daha okunabilir
- Satır aralığı `1.85` → `1.9` — daha rahat
- `text-foreground/90` → `text-foreground/85` — hafifçe yumuşak, gözü yormaz
- `font-light` (300 weight) — daha zarif okuma hissi

**4. Padding ve Boşluk**
- Paragraflar arası `mb-5` → `mb-8` — divider ile birlikte daha ferah
- İç padding `px-5` → `px-6` — kenarlarda daha fazla nefes alanı

Tek dosya değişikliği. Metin temizleme mantığı aynen korunacak.

