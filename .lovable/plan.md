
## Plan: Tüm Yükleme Ekranlarını Audio Guide Temalı Hale Getir + Tab Kayma Düzeltmesi

### 1. AudioGuideLoader'a `variant="inline"` ekle
`src/components/AudioGuideLoader.tsx` — Küçük alanlar (review, search, admin panel) için kompakt loader: küçük kulaklık (w-5 h-5) + mini AudioWave + opsiyonel mesaj. `min-h-[100px]`, tek satır layout.

### 2. Buton içi spinner'ları temalı yap
Tüm dosyalardaki `Loader2 className="... animate-spin"` buton içi kullanımları → küçük AudioWave (size="sm") + mevcut metin ile değiştir. `animate-spin` yerine audio wave animasyonu.

Etkilenen dosyalar (buton spinner):
- `src/components/GuideCard.tsx` — "Processing..." butonu
- `src/components/EmbeddedCheckout.tsx` — "Processing..." butonları
- `src/components/AdminGuideEditForm.tsx` — "Updating Guide...", "Loading sections..."
- `src/components/AILogoGenerator.tsx` — "Generating..."
- `src/pages/AdminPanel.tsx` — "Generating...", "Creating Guide..."
- `src/components/GuideSectionsManager.tsx` — section loading + add button
- `src/components/AdminEmailTesting.tsx` — "Loading...", "Sending..."
- `src/components/EnhancedLogoUploader.tsx` — "Processing...", "Uploading..."
- `src/components/EmailSystemTest.tsx` — "Testing..."
- `src/components/AdminQRCodeRegenerator.tsx` — refresh, regenerate

### 3. Sayfa/component loading state'leri → AudioGuideLoader
| Dosya | Mevcut | Yeni |
|-------|--------|------|
| `MultiTabAudioPlayer.tsx` satır 324-331 | `animate-spin` div + metin | `AudioGuideLoader variant="inline"` |
| `MultiTabAudioPlayer.tsx` satır 421-428 | `animate-spin` div + metin | `AudioGuideLoader variant="inline"` |
| `StatsSection.tsx` satır 78-83 | `Loader2 animate-spin` | `AudioGuideLoader variant="inline"` |
| `ReviewsSection.tsx` satır 163-172 | `animate-pulse` dikdörtgenler | `AudioGuideLoader variant="inline"` |
| `EnhancedProfile.tsx` satır 29-38 | "Loading profile..." metin | `AudioGuideLoader variant="page" message="Loading profile..."` |
| `AdminAnalyticsManager.tsx` satır 191-205 | `RefreshCw animate-spin` | `AudioGuideLoader variant="page" message="Loading analytics..."` |
| `AdminBrandingManager.tsx` satır 106-109 | `animate-spin` div | `AudioGuideLoader variant="page"` |
| `AdminHomepageStats.tsx` satır 158-162 | `Loader2 animate-spin` | `AudioGuideLoader variant="inline"` |
| `GuideSectionsManager.tsx` satır 173-177 | `Loader2 animate-spin` | `AudioGuideLoader variant="inline"` |
| `EnhancedLogoUploader.tsx` satır 146-150 | `Loader2 + metin` | `AudioGuideLoader variant="inline" message="Loading logo settings..."` |
| `GuideDetail.tsx` satır 594-612 | `animate-pulse` skeleton div'ler | AudioWave ekle (kulaklık ikonu + wave bar ile temalı skeleton) |
| `AudioPlayer.tsx` satır 317 | `animate-spin` div | Küçük AudioWave |
| `SectionAudioPlayer.tsx` satır 362 | `animate-spin` div | Küçük AudioWave |

### 4. AudioAccess tab kayma düzeltmesi
`src/components/MultiTabAudioPlayer.tsx` — Tab değişiminde sayfa scroll'u kayıyor çünkü `TabsContent` yüksekliği değişiyor. Çözüm:
- Tab değişiminde `scrollTop` koruma: `onValueChange` içinde mevcut scroll pozisyonunu kaydet ve tab geçişinden sonra geri yükle
- Veya `TabsContent`'e sabit `min-h` ekle ki content boyutu değişmesin

### 5. Dokunulmayacak dosyalar
- `NewSectionAudioPlayer.tsx`, `ChapterList.tsx` — ses dosyası logic'i
- `useAudioProgress.ts`, `useAudioSource.ts` — audio hook'ları

### Etkilenen Dosyalar (toplam ~18)
- `src/components/AudioGuideLoader.tsx` — inline variant
- `src/components/MultiTabAudioPlayer.tsx` — loader + kayma fix
- `src/components/StatsSection.tsx`
- `src/components/ReviewsSection.tsx`
- `src/components/EnhancedProfile.tsx`
- `src/components/AdminAnalyticsManager.tsx`
- `src/components/AdminBrandingManager.tsx`
- `src/components/AdminHomepageStats.tsx`
- `src/components/GuideSectionsManager.tsx`
- `src/components/EnhancedLogoUploader.tsx`
- `src/components/GuideCard.tsx`
- `src/components/EmbeddedCheckout.tsx`
- `src/components/AdminGuideEditForm.tsx`
- `src/components/AILogoGenerator.tsx`
- `src/pages/AdminPanel.tsx`
- `src/pages/GuideDetail.tsx`
- `src/components/AudioPlayer.tsx`
- `src/components/SectionAudioPlayer.tsx`
- `src/components/AdminEmailTesting.tsx`
- `src/components/EmailSystemTest.tsx`
- `src/components/AdminQRCodeRegenerator.tsx`
