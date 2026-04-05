

## Plan: AudioAccess Sayfası — Kullanıcı Dostu Yeniden Tasarım + Tam Sayfa Çevirisi

### Araştırma Bulguları

**Veritabanı kontrolü**: Tüm audio guide'larda İngilizce (`en`) section'lar mevcut — her guide'da en az 1 İngilizce section var. Dolayısıyla varsayılan dil güvenle `en` olabilir.

**Mevcut sorun — Varsayılan dil**: `detectAvailableLanguages()` (satır 282) RPC'den dönen **ilk dili** seçiyor, bu her zaman İngilizce olmayabilir (alfabetik sıralama `de` > `en` yapabilir).

**Mevcut sorun — Sayfa çevirisi yok**: Dil değiştiğinde sadece audio section'lar değişiyor. Sayfadaki tüm statik metinler İngilizce kalıyor:
- `AudioAccess.tsx`: "Leave a Review", konum/süre bilgileri
- `ChapterList.tsx`: "Up Next", "Playback Speed", "Normal", zaman formatları
- `GuestReviewForm.tsx`: "Leave a Review", "Name", "Email", "Rating", "Submit Review", placeholder'lar, hata mesajları
- `GuideLanguageSelector.tsx`: "Language" etiketi
- `MultiTabAudioPlayer.tsx`: "Loading...", tab başlıkları
- `NewSectionAudioPlayer.tsx`: "No audio content available"
- Hata/erişim sayfaları: "Access Denied", "Browse Guides", "Go Home"

---

### Değişiklikler

#### 1. Çeviri sistemi oluştur — `src/lib/translations.ts`
Desteklenen diller için tüm UI etiketlerini içeren bir çeviri sözlüğü:

```text
Anahtarlar:
- upNext, language, leaveReview, name, email, rating, review
- submitReview, submitting, playbackSpeed, normal
- noAudioContent, loading, accessDenied, browseGuides, goHome
- shareFeedback, reviewDescription, namePlaceholder, emailPlaceholder
- reviewPlaceholder, minutes (min), reviewSuccess
- connectionIssue, retryConnection, paymentRetry
```

Desteklenen diller: en, tr, es, fr, de, it, pt, ru, zh, ja, ko, ar (veritabanındaki tüm aktif diller).

Basit bir `t(key, lang)` fonksiyonu — harici kütüphane yok.

#### 2. Varsayılan dili İngilizce yap — `AudioAccess.tsx`
- `selectedLanguage` başlangıç değerini `'en'` yap (mevcut: `''`)
- `detectAvailableLanguages()` içinde: İngilizce varsa onu seç, yoksa ilk mevcut dili seç
- Sayfa ilk açıldığında her zaman İngilizce section'lar yüklensin

#### 3. Sayfa çevirisini uygula — `AudioAccess.tsx`
- Tüm statik metinleri `t(key, selectedLanguage)` ile değiştir:
  - "Leave a Review" başlığı
  - Konum/süre etiketleri
  - Hata sayfası metinleri ("Access Denied", buton yazıları)

#### 4. ChapterList çevirisi — `ChapterList.tsx`
- `lang` prop'u ekle
- "Up Next" → `t('upNext', lang)`
- "Playback Speed" → `t('playbackSpeed', lang)`
- "Normal" → `t('normal', lang)`

#### 5. GuestReviewForm çevirisi — `GuestReviewForm.tsx`
- `lang` prop'u ekle
- Tüm label, placeholder ve buton metinlerini çevir
- Hata mesajlarını çevir (toast'lar dahil)

#### 6. GuideLanguageSelector çevirisi — `GuideLanguageSelector.tsx`
- "Language" etiketini `t('language', selectedLanguage)` ile değiştir

#### 7. NewSectionAudioPlayer çevirisi — `NewSectionAudioPlayer.tsx`
- `lang` prop'u ekle, ChapterList'e ilet
- "No audio content available" → çevrilmiş metin

#### 8. UX iyileştirmeleri — `AudioAccess.tsx`
- Dil seçicisini Card header'ının içinde daha belirgin konuma taşı (guide bilgilerinin hemen altında, ayrı bir satırda)
- Section sayısını ve toplam süreyi dil seçici yanında göster (kullanıcı hangi dilde kaç bölüm olduğunu görsün)
- Review formunu görsel olarak ayır — daha belirgin bir bölüm başlığı ve ikon ekle

---

### Etkilenen Dosyalar
- `src/lib/translations.ts` — **YENİ** (çeviri sözlüğü + `t()` fonksiyonu)
- `src/pages/AudioAccess.tsx` — varsayılan dil + çeviri + UX
- `src/components/ChapterList.tsx` — lang prop + çeviri
- `src/components/GuestReviewForm.tsx` — lang prop + çeviri
- `src/components/GuideLanguageSelector.tsx` — etiket çevirisi
- `src/components/NewSectionAudioPlayer.tsx` — lang prop geçişi
- `src/components/MultiTabAudioPlayer.tsx` — lang prop geçişi

### Sonuç
- Sayfa her zaman İngilizce açılır
- Dil değiştirildiğinde tüm UI metinleri (başlıklar, butonlar, form etiketleri, hatalar) seçilen dile çevrilir
- Audio section içerikleri zaten mevcut sistemle dil bazlı yükleniyor — bu korunur
- Kullanıcı deneyimi tutarlı ve erişilebilir

