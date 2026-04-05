

## Plan: Drawer İçi Kaydırma Sorununu Düzelt

### Sorun Analizi

Video ve koddan tespit edilen 2 sorun:

1. **İçerik kaydırılamıyor**: Drawer `half` snap'te açılıyor (`translateY(35vh)`), sheet yüksekliği `95vh`. Görünen alan ~60vh. İçerik taşsa bile mobilde scroll çalışmıyor — çünkü `overflow-y-auto` olan content div doğru yükseklik hesaplayamıyor olabilir. `flex-1` + `min-h-0` teoride doğru ama `transform`'lu parent'ta bazı mobil tarayıcılar bunu düzgün hesaplamıyor.

2. **Aşağıdaki içerik görünmüyor**: İçerik taşıyor ama scroll alanı onu göstermiyor — content div'in gerçek yüksekliği sınırlanmamış, taşma yok.

### Çözüm — `src/components/ui/bottom-sheet.tsx`

Content div'e **explicit max-height** vererek overflow'u garanti altına al. `flex-1 min-h-0` yerine content'in gerçek yüksekliğini hesapla:

1. **Content div'e computed height**: Drag handle (~28px) + header (~52px) = ~80px overhead. Content max-height: `calc(95vh - 80px)`. Bu sayede tarayıcı kesin olarak overflow scroll'u tetikler.

2. **Title yoksa overhead daha az**: Header render edilmiyorsa sadece drag handle overhead'i var (~28px).

3. **Content div'e `overflow-y: scroll` (auto yerine)**: Bazı mobil tarayıcılarda `auto` scroll bar'ı göstermez ve touch scroll'u tetiklemez. `scroll` zorlar.

### Değişiklik Detayı

**Content div (satır 229-232)**:
```tsx
<div
  className="overflow-y-scroll px-4 pb-safe"
  style={{ 
    overscrollBehavior: 'contain', 
    touchAction: 'pan-y', 
    WebkitOverflowScrolling: 'touch',
    maxHeight: title ? 'calc(95vh - 80px)' : 'calc(95vh - 28px)',
  }}
>
```

- `flex-1 min-h-0` kaldırılıp explicit `maxHeight` ile değiştirilecek
- `overflow-y-auto` → `overflow-y-scroll`
- Bu sayede content her zaman scrollable olacak ve alt kısımdaki içerik erişilebilir olacak

### Etkilenen Dosya
- `src/components/ui/bottom-sheet.tsx` — content div style değişikliği (1 yer)

