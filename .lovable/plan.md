

## Düzeltme: Guide Detail — LiveListenersBadge Taşması

### Problem

Badge `inline-flex` olduğu için içerik genişliğine göre büyüyor ve `flex-1 min-w-0` kapsayıcısından taşıyor. Özellikle 390px mobil genişlikte görsel (w-32 = 128px) + gap (16px) sonrası kalan alan ~246px — badge bu alana sığmıyor ve gradient border dışarı taşıyor.

### Çözüm

`LiveListenersBadge` badge varyantının dış kapsayıcısına `max-w-full` ekleyerek taşmayı engelle. Ayrıca metin kısmına `truncate` ekleyerek uzun sayılarda bile taşma olmasın.

### Teknik

```
src/components/LiveListenersBadge.tsx

Satır 35 — dış div:
  Ekle: max-w-full

Satır 36 — iç div:
  Ekle: max-w-full

Satır 39 — span:
  Ekle: truncate
```

### Performans Notu

GuideCard'daki `line-clamp-2` + `break-words` değişikliği saf CSS'tir — JavaScript çalıştırmaz, DOM manipulation yoktur, performans etkisi sıfırdır.

