

## Plan: Drawer Kapatma Butonu ve Sayfa Kayma Düzeltmesi

### Sorunlar

1. **X butonu belirgin değil** — `bg-muted/50` + `text-muted-foreground` çok soluk, mobilde görünmüyor
2. **X'e tıklayınca sayfa kayıyor** — Scroll lock (`overflow: hidden`) `visible` false olunca hemen kalkıyor ama sheet henüz animate-out olmamış. Bu arada body scroll'u geri geliyor ve pozisyon kayıyor.
3. **X tıklaması drawer'ı kapatamıyor / audio başlatıyor** — Header div'inde `onTouchStart/Move/End` drag handler'ları var. Mobilde X'e dokunulduğunda önce parent'ın touch handler'ı ateşleniyor, drag başlıyor, click event düzgün çalışmıyor. Touch olayı content'e de sızabilir.

### Çözümler

#### 1. X butonunu belirgin yap (`bottom-sheet.tsx`)
- `bg-muted/50` → `bg-foreground/10 border border-border` + daha büyük dokunma alanı (`p-2.5`)
- `text-muted-foreground` → `text-foreground`
- Minimum 44px touch target

#### 2. X butonunda event propagation'ı durdur
- `onTouchStart`, `onTouchEnd`, `onClick` hepsinde `e.stopPropagation()` ve `e.preventDefault()`
- Bu sayede parent header'daki drag handler'ları tetiklenmez
- `onPointerDown` da ekle — tam güvenlik

#### 3. Scroll lock'u transition bitene kadar koru
- Mevcut: `rendered && visible` iken lock → `visible` false olunca hemen unlock → sayfa kayar
- Düzeltme: lock'u `rendered` state'ine bağla (unmount'a kadar tut)
- `rendered` ancak `handleTransitionEnd`'de false olur → kapanma animasyonu bittikten sonra scroll açılır

### Değişiklik — `src/components/ui/bottom-sheet.tsx`

**Scroll lock effect** (satır 67-77):
```
// rendered && visible → sadece rendered
if (rendered) { lock } else { unlock }
```

**X butonu** (satır 215-220):
```tsx
<button
  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenChange(false); }}
  onTouchStart={(e) => e.stopPropagation()}
  onTouchEnd={(e) => e.stopPropagation()}
  onPointerDown={(e) => e.stopPropagation()}
  className="rounded-full p-2.5 bg-foreground/10 border border-border hover:bg-foreground/20 transition-colors"
  aria-label="Close"
>
  <X className="h-5 w-5 text-foreground" />
</button>
```

### Etkilenen Dosya
- `src/components/ui/bottom-sheet.tsx` — 3 değişiklik (scroll lock, X styling, event propagation)

