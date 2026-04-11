

## Görsel + Dil Emojileri Yan Yana, Listening Now + Bölge Altında

### Yeni Layout

```text
┌──────────────────────────────┐
│ [Görsel 128x128] [🇺🇸🇫🇷🇳🇱🇨🇳] │  ← Görsel sol, dil emojileri sağda
│                  [🇪🇸🇮🇹🇯🇵] │
│                  [🇵🇹🇰🇷]    │
├──────────────────────────────┤
│ 🎧 112 listening now         │  ← Resmin altında
│ 📍 Cappadocia, Turkey        │  ← Badge olarak
│ ⏱ 66 min · 19 stops          │
└──────────────────────────────┘
```

### Değişiklik — `src/pages/GuideDetail.tsx` (satır 682-718)

1. İlk satır: `flex gap-4` ile görsel (sol) + dil seçici (sağ, `flex-1 flex-wrap items-start`)
2. İkinci bölüm (`space-y-1.5`): LiveListenersBadge, ardından konum bilgisi badge olarak (`bg-primary/10 text-primary rounded-full px-2.5 py-1`), süre/stops bilgisi

```tsx
<div className="space-y-3">
  {/* Üst: Görsel + Dil emojileri yan yana */}
  <div className="flex gap-4">
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden shadow-lg">
      <OptimizedImage ... />
      <Badge ...>{guide.category}</Badge>
    </div>
    <div className="flex-1 min-w-0 flex items-start">
      {guide?.id && (
        <GuideLanguageSelector
          guideId={guide.id}
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}
    </div>
  </div>

  {/* Alt: Listening + Konum badge + Süre */}
  <div className="flex flex-col gap-1.5">
    <LiveListenersBadge guideId={guide.id} />
    <span className="inline-flex items-center gap-1.5 w-fit bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1">
      <MapPin className="w-3 h-3" />
      {guide.location}
    </span>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="w-3 h-3 text-primary/60 shrink-0" />
      <span>{displayDuration} min</span>
      <span>·</span>
      <span>{currentChapters.length} stops</span>
    </div>
  </div>
</div>
```

Tek dosya, tek bölüm değişikliği. Görsel boyutu ve diğer tasarım öğeleri aynı kalır.

