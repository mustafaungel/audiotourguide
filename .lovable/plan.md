

## Plan: "Loading app…" Yazısını Kaldır

### Sorun
`index.html` satır 51'de `<div id="root">Loading app…</div>` yazıyor. React uygulaması hydrate olana kadar bu metin görünüyor. JS bundle büyük olduğunda veya ağ yavaş olduğunda kullanıcı bunu birkaç saniye görüyor.

### Çözüm
"Loading app…" metnini, markayla uyumlu minimal bir spinner ile değiştir. Bu spinner, React mount olduğunda otomatik olarak kaybolacak.

### Değişiklik

**Dosya: `index.html` (satır 51)**
- `Loading app…` metnini kaldır
- Yerine CSS-only bir spinner koy (inline style ile, dış bağımlılık yok)
- Spinner tasarımı: uygulamanın mevcut primary rengi (#8B5CF6) ile dönen bir halka
- React mount olunca `#root` içeriği otomatik değişecek, ekstra JS gerekmez

### Risk
Sıfır. Sadece HTML fallback içeriği değişiyor.

