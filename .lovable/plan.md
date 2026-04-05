

## Plan: Drawer İçinde Kaydırmayı Düzelt

### Sorun
Content div'inde `overflow-y: auto` var ama `touchAction` ayarı eksik. Backdrop'taki `touchAction: 'none'` ve drawer'ın genel touch handling'i içerik scroll'unu engelliyor olabilir. Ayrıca content alanının yüksekliği `flex-1` ile belirleniyor ama parent'ın yüksekliği ve transform yapısı mobilde scroll alanını düzgün hesaplatmıyor olabilir.

### Çözüm — `src/components/ui/bottom-sheet.tsx`

1. **Content div'e `touchAction: 'pan-y'`** ekle — tarayıcıya bu alanda dikey scroll'a izin vermesini söyler
2. **Content div'e `-webkit-overflow-scrolling: touch`** ekle — iOS'ta momentum scroll için
3. **Content'in min-height'ını sıfırla** (`min-h-0`) — flex child'ların overflow-scroll yapabilmesi için gerekli (flexbox kuralı)

Tek dosya, 3 satırlık değişiklik.

