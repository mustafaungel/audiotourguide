

## Mobil Scroll + Auto-Zoom Duzeltmeleri

### Sorun 1: Sayfa asagi kayik aciliyor

`ScrollToTop.tsx`'de `window.scrollTo` kullaniliyor ama mobil tarayicilarin (ozellikle Safari) kendi scroll restoration mekanizmasi bunu gecersiz kilabiliyor.

**Cozum:** `history.scrollRestoration = 'manual'` + `requestAnimationFrame` sarmalayici.

### Sorun 2: Mobilde input/textarea'ya tiklaninca auto-zoom

`index.html` viewport meta tag'inde `maximum-scale=1` yok. iOS Safari, font-size 16px'den kucuk input/textarea'lara odaklandiginda otomatik zoom yapar. Projede `text-sm` (14px) kullaniliyor — bu zoom'u tetikler.

**Cozum:** Viewport meta tag'ine `maximum-scale=1` ekle. Bu, iOS'un otomatik zoom'unu engeller ama kullanicinin pinch-to-zoom'unu da kisitlar. Erisilebilirlik icin alternatif olarak tum input/textarea'larin font-size'ini 16px'e cikarabiliriz — ama bu tasarimda degisiklik yaratir.

En temiz cozum: her ikisini de yapmak — `maximum-scale=1` + input'larda `text-base` (16px) mobilde.

### Degisiklikler

**1. `index.html` — viewport meta tag**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**2. `src/components/ScrollToTop.tsx` — scroll fix**
- `history.scrollRestoration = 'manual'` (bir kere, mount'ta)
- `requestAnimationFrame` icinde `window.scrollTo`

**3. `src/index.css` — Mobilde input zoom onleme (opsiyonel ek guvenlik)**
```css
@media screen and (max-width: 768px) {
  input, textarea, select { font-size: 16px !important; }
}
```

### Teknik Ozet

```
3 dosya:
  index.html — viewport: maximum-scale=1, user-scalable=no
  ScrollToTop.tsx — scrollRestoration manual + rAF
  index.css — mobil input font-size 16px
```

