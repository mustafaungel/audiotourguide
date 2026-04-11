

## Geri Navigasyonda Scroll Pozisyonu Koruma

### Sorun

`ScrollToTop` bileşeni her `pathname` değişikliğinde `window.scrollTo(0, 0)` çağırıyor. Bu, tarayıcının geri/ileri butonuyla navigasyonda da çalışıyor — kullanıcı geri döndüğünde sayfa en üstten başlıyor, bıraktığı yerden değil.

### Çözüm

Navigasyon tipini kontrol et: sadece **yeni sayfa açılışlarında** (PUSH) en üste kaydır, **geri/ileri** (POP) navigasyonlarda tarayıcının kendi scroll restoration'ını kullan.

### Değişiklik

**`src/components/ScrollToTop.tsx`**

```tsx
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Sadece yeni sayfa açılışlarında (link tıklama, navigate()) en üste kaydır
    // Geri/ileri (POP) navigasyonlarda tarayıcı scroll pozisyonunu kendisi yönetir
    if (navigationType !== "POP") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      });
    }
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
```

- `history.scrollRestoration = 'manual'` satırı kaldırılır — tarayıcının POP navigasyonlarda scroll'u geri yüklemesine izin verilir
- `useNavigationType()` ile PUSH/REPLACE ve POP ayrımı yapılır

### Teknik Özet

```
1 dosya: src/components/ScrollToTop.tsx
```

