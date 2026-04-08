

## Plan: Dil Fallback + BottomSheet İçi MiniPlayer Düzeltmesi

### Değişiklik 1: Bağlı Rehberlerde Dil Fallback

**Problem:** Kullanıcı ana rehberi Rusça dinliyor → bağlı rehbere geçiyor → Rusça section yok → boş liste.

**Çözüm:** `ensureGuideSections` fonksiyonunda, istenen dilde section bulunamazsa otomatik olarak İngilizce'ye düş:

```text
İstenen dil (ör: ru) → section yok?
  → İngilizce (en) dene → section var? → kullan
  → İngilizce de yok? → mevcut ilk dili bul ve kullan
  → languageByGuide state'ini fallback diliyle güncelle
```

### Değişiklik 2: BottomSheet İçinde MiniPlayer Düzeltmesi

**Problem:** MiniPlayer `sticky bottom-0` olarak sheet'in scroll content'i içinde render ediliyor. Bu, scroll container'ın `maxHeight` ve `overflow-y: scroll` kısıtlaması nedeniyle düzgün yapışmıyor — content ile birlikte kayıyor veya kısmen kesiliyorsa görünmüyor.

**Çözüm:** MiniPlayer'ı BottomSheet'in scroll alanı **dışına** çıkar. BottomSheet'in flex layout'unu kullanarak MiniPlayer'ı scroll content'in altında, sheet'in kendi alt kenarına sabitlenmiş şekilde render et:

- `NewSectionAudioPlayer` → MiniPlayer'ı ayrı bir callback/render prop ile dışarı çıkar
- Alternatif (daha basit): BottomSheet content div'inin `maxHeight` hesaplamasını MiniPlayer yüksekliğini hesaba katacak şekilde güncelle ve MiniPlayer'ı content div'den **sonra**, sheet flex container'ın içinde ama scroll'un dışında render et

Pratik uygulama: `NewSectionAudioPlayer`'a bir `renderMiniPlayerOutside` callback prop eklemek yerine, daha temiz bir yaklaşımla MiniPlayer'ı sheet'in scroll alanından ayıracağız:

- `NewSectionAudioPlayer` içinde `insideSheet` true ise MiniPlayer'ı component return'ün en dışına, `space-y-6` div'in dışına render et
- BottomSheet content wrapper'ında MiniPlayer'ın görünür kalması için scroll container'a `pb-20` padding ekle

### Teknik Değişiklikler

**`src/components/MultiTabAudioPlayer.tsx`:**
- `ensureGuideSections`'a İngilizce fallback zinciri ekle
- Fallback dili `languageByGuide` state'ine yaz

**`src/components/NewSectionAudioPlayer.tsx`:**
- `insideSheet` true ise MiniPlayer'ı `space-y-6` div'in **dışında** render et (fragment ile)
- Sheet scroll content'ine MiniPlayer için yer açmak amacıyla alt padding ekle

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MultiTabAudioPlayer.tsx` | `ensureGuideSections`'a en fallback, languageByGuide güncelleme |
| `src/components/NewSectionAudioPlayer.tsx` | insideSheet modda MiniPlayer konumlandırma düzeltmesi |

