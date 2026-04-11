

## GuideDetail — Ana Navigation Sticky'liğini Kaldır

### Problem
GuideDetail sayfasında hem Navigation (sticky top-0) hem de sayfa içi sticky header (sticky top-14) birlikte sticky kalıyor. Bu çift katmanlı yapı gereksiz — zaten sayfanın kendi sticky header'ı başlık, geri butonu ve dil bilgisini gösteriyor. Ana Navigation'ın burada sticky olmasına gerek yok.

### Çözüm
Navigation bileşenine bir `sticky` prop ekleyerek, GuideDetail'dan çağrıldığında sticky davranışını kapatmak:

**1. `src/components/Navigation.tsx`**
- Props'a `sticky?: boolean` ekle (default: `true`)
- `sticky === false` ise `sticky top-0` yerine sadece `relative` kullan

**2. `src/pages/GuideDetail.tsx` (satır 662)**
- `<Navigation sticky={false} />` olarak çağır
- Sayfa içi sticky header'ın `top` değerini `top-0` olarak güncelle (artık üstünde sticky Navigation yok, ama Navigation yüksekliği hâlâ DOM'da — scroll edince üstüne geçecek)

### Etki
- Diğer tüm sayfalar etkilenmez (default `sticky={true}`)
- GuideDetail'da scroll yapıldığında Navigation yukarı kaybolur, sadece sayfa içi compact header kalır

