

## Plan: Fix Language Selection Not Updating on Audio Access Page

### Root Cause

In `GuideLanguageSelector.tsx` line 78, `isInMultiTab` is `true` whenever `activeGuideId` is set. When true, it **always** dispatches a `changeGuideLanguage` custom event instead of calling `onLanguageChange()`.

Meanwhile in `AudioAccess.tsx` line 397, the event listener **intentionally skips** the main guide:
```
if (targetGuideId && targetGuideId !== guide?.id) { ... }
```

So when the user taps a language for the **main guide** in multi-tab mode:
1. Selector dispatches `changeGuideLanguage` with `guideId = mainGuideId`
2. AudioAccess event listener sees it's the main guide → ignores it
3. `onLanguageChange` (handleLanguageChange) is never called
4. `selectedLanguage` stays `'en'` → UI appears stuck on English

### Fix

In `GuideLanguageSelector.tsx`, check if the active guide IS the guide itself (i.e., `activeGuideId === guideId`). If so, call `onLanguageChange()` directly instead of dispatching the event. Only dispatch the event for **linked** (different) guides.

### Change

**`src/components/GuideLanguageSelector.tsx`** — lines 77-84:

```tsx
requestAnimationFrame(() => {
  const isInMultiTab = !!activeGuideId;
  const isLinkedGuide = isInMultiTab && activeGuideId !== guideId;
  if (isLinkedGuide) {
    window.dispatchEvent(new CustomEvent('changeGuideLanguage', {
      detail: { guideId: activeGuideId, languageCode }
    }));
  } else {
    onLanguageChange(languageCode);
  }
});
```

This ensures main guide language changes go through `onLanguageChange` → `handleLanguageChange` → `setSelectedLanguage` + fetch sections, while linked guide changes continue using the event system.

### Files affected

| File | Change |
|------|--------|
| `src/components/GuideLanguageSelector.tsx` | Fix dispatch condition to call `onLanguageChange` for main guide |

