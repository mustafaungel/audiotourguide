

## Plan: AudioAccess Sayfa — Bağlı Rehber ve Dil Seçimi UX İyileştirmesi

### Mevcut Durum
- Pill butonları düz `bg-muted/50` ile basit görünümlü — audio temasıyla uyumsuz
- Dil seçici fonksiyonel ama bağlı rehberlerle entegrasyonu sezgisel değil — kullanıcı hangi rehber için dil değiştirdiğini anlamakta zorlanabiliyor
- BottomSheet içinde player açılıyor ama hangi rehberin aktif olduğuna dair görsel ipucu yeterli değil

### Değişiklikler

---

#### 1. Pill Butonları — Premium Audio Kartları (`MultiTabAudioPlayer.tsx`)

Mevcut düz butonları kart formatına yükselt:
- Her pill'e sol kenarda 3 barlı mini waveform dekorasyonu (ChapterList'tekiyle tutarlı)
- `Headphones` ikonu (`Music` yerine) — site geneli tutarlılık
- Aktif pill'e `audio-card-glow` ve gradient arka plan
- Pasif pill'lere `backdrop-blur-sm` ve hover'da `bg-primary/5` geçişi
- Her pill'in sağ tarafında bölüm sayısı badge'i (varsa cache'den, yoksa "…")
- Pill'ler arası ayırıcı olarak ince `border-b border-border/20` (son hariç)

#### 2. Dil Seçici — BottomSheet İçine Taşıma (`MultiTabAudioPlayer.tsx` + `AudioAccess.tsx`)

Şu anki akış: Dil seçici sayfanın hero bölümünde, pill butonlarının üstünde. Kullanıcı bağlı rehber açtığında bile üst dil seçici ana rehberi değiştiriyor — kafa karıştırıcı.

**İyileştirme:**
- Ana sayfadaki dil seçici (hero altında) sadece ana rehber için kalır — davranış değişmez
- BottomSheet içine, player üstüne küçük bir satır içi dil seçici ekle — sadece o rehberin dillerini gösterir
- Bu satır içi seçici kompakt: bayrak butonları yatay sıralanmış, seçili olan vurgulu
- Böylece kullanıcı her rehber için bağımsız dil değiştirebilir

#### 3. BottomSheet Başlık Alanı — Audio Kimliği (`MultiTabAudioPlayer.tsx`)

- Sheet başlığının yanına `Headphones` ikonu ekle
- Başlık altına rehberin bölüm sayısı ve toplam süre meta bilgisi ekle (sections'dan hesapla)
- Aktif rehber adını sheet drag handle altında göster

#### 4. AudioAccess Hero — Pill Bölümü Üstü Başlık (`AudioAccess.tsx`)

- MultiTabAudioPlayer'ın hemen üstüne "Your Audio Guides" mini başlığı ekle (waveform dekorasyonlu)
- Bu başlık sadece linkedGuides > 0 olduğunda görünür

---

### Dokunulmayacaklar
- Tüm Supabase queries, access verification, payment flow — sıfır değişiklik
- NewSectionAudioPlayer, ChapterList — aynen kalır
- BottomSheet bileşeni — yapısal değişiklik yok
- Mevcut dil değiştirme event sistemi — aynen kalır, sadece BottomSheet içinden de tetiklenebilir hale gelir

### Dosya Özeti

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/MultiTabAudioPlayer.tsx` | Pill tasarımı yenile, sheet içi kompakt dil seçici, başlık meta bilgisi |
| `src/pages/AudioAccess.tsx` | "Your Audio Guides" mini başlık, player bölümü üstü |

