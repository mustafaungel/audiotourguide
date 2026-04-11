

## GuideCard, Featured Detail & Back Button — Unified Premium Redesign

### 4 Ana Degisiklik

---

### 1. Inline LiveListenersBadge — Ekolayzer Kaldir

**Dosya:** `LiveListenersBadge.tsx`

Inline variant'tan `MiniEqualizer` kaldirilir. Sadece `Headphones` icon + `{count} listening` text kalir. Ekolayzer gorevi kartlarin altindaki waveform'a devredilir.

---

### 2. Normal Kartlarin Alt Waveform'u Animasyonlu Olsun

**Dosya:** `GuideCard.tsx`

Normal kartlardaki bottom waveform `animation: 'none'` → `animation: 'equalizer-bar 2.2s ease-in-out infinite'` olarak degistirilir. Featured kartlarda zaten animasyonlu — iki kart tipi ayni animasyona sahip olur.

**Featured ve Normal kart ayni layout'u paylasmali:**
- Featured kartlar simdi buyuk gorsel + overlay baslik kullanıyor, normal kartlar yatay layout — bunlar farkli boyutlarda gorunuyor
- Cozum: Featured kartlar da **normal kartlarla ayni yatay layout**'u kullansın
- Featured farki: amber/gold ince border (`border-amber-500/30`), ust band amber gradient, kucuk `★ Featured` badge'i ust bantta, waveform bar'lari `bg-amber-500/60` renkte
- Buyuk gorsel + overlay layout tamamen kaldirilir

```text
Featured kart (yeni):
┌──────────────────────────────────┐
│ 🎧 ★ Featured · Guide Title     │  ← amber gradient band
├──────────────────────────────────┤
│ [gorsel]  │ 📍 Location          │
│  144x144  │ ⏱ 66 min             │
│ Category  │ 🇹🇷🇬🇧🇷🇺               │
│           │ 🎧 135 listening  ▶  │
├──────────────────────────────────┤
│ .,|.|.,|.|.,|.|.,|.|.,          │  ← amber animasyonlu waveform
└──────────────────────────────────┘

Normal kart (ayni layout, primary renk):
┌──────────────────────────────────┐
│ 🎧 Guide Title                  │  ← primary gradient band
├──────────────────────────────────┤
│ [gorsel]  │ 📍 Location          │
│  144x144  │ ⏱ 66 min             │
│ Category  │ 🇹🇷🇬🇧🇷🇺               │
│           │ 🎧 135 listening  ▶  │
├──────────────────────────────────┤
│ .,|.|.,|.|.,|.|.,|.|.,          │  ← primary animasyonlu waveform
└──────────────────────────────────┘
```

---

### 3. Featured Guide Detay Sayfasi — Ozel Amber Tasarim

**Dosya:** `GuideDetail.tsx`

Guide detay sayfasinda `realGuideData?.is_featured` kontrol edilir. Featured ise:
- Sticky header: `bg-gradient-to-r from-amber-500/10 to-yellow-500/5` arka plan
- Back button: amber tonu (`bg-amber-500/15 hover:bg-amber-500/25, text-amber-600`)
- Category badge: amber gradient (`from-amber-500 to-yellow-500`)
- LiveListenersBadge yanina kucuk `★ Featured` badge'i eklenir
- Player card'a ince amber border (`border-amber-500/20`)

Non-featured guide'lar mevcut primary tema ile ayni kalir.

---

### 4. Back Button — Tum Sayfalarda Tek Tasarim

**Dosyalar:** `GuideDetail.tsx`, `AudioAccess.tsx`

Mevcut durum:
- GuideDetail: `w-10 h-10 rounded-full bg-primary/15` (yuvarlak buton)
- AudioAccess: Duz ikon, stil yok (`flex items-center justify-center w-10 h-10`)

Cozum: Tek tutarli tasarim — GuideDetail'daki yuvarlak buton stili her yerde kullanilir:
```
w-10 h-10 rounded-full bg-primary/15 hover:bg-primary/25
flex items-center justify-center transition-colors active:scale-90
```

AudioAccess'teki back button bu stile guncellenir.

---

### Teknik Ozet

```
4 dosya:
  LiveListenersBadge.tsx — inline variant: ekolayzer kaldir
  GuideCard.tsx — featured layout = normal layout + amber aksan, normal waveform animasyonlu
  GuideDetail.tsx — is_featured kontrolu ile amber tema, back button tutarliligi
  AudioAccess.tsx — back button stili GuideDetail ile ayni
```

