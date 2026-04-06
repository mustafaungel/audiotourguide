
Goal: fix the remaining mobile language-switch lag on Guide Detail / Audio Access, and make Admin Content Management reflect edits immediately without a manual refresh.

1. Fix the real source of mobile lag in language switching
- `GuideDetail.tsx` and `AudioAccess.tsx` still fetch language content directly on every tap.
- `MultiTabAudioPlayer.tsx` also listens to the same `changeGuideLanguage` event and fetches again.
- This creates duplicate work, extra RPC/database requests, state churn, and a remount of heavy audio UI on mobile.

Implementation:
- Make one component responsible for fetching language-switched sections:
  - Keep page-level fetch for the main guide only.
  - Keep `MultiTabAudioPlayer` responsible only for linked guides.
- In `MultiTabAudioPlayer.tsx`, ignore the global language event when `targetId === mainGuide.id` because the page already handles the main guide.
- Remove eager linked-guide prefetch loops that run on language change and on linked-guide load. Load linked guide sections only when the user opens that linked guide.
- Add in-memory per-guide+language caching in `MultiTabAudioPlayer` so switching back to a previously opened language feels instant.

2. Reduce unnecessary remount/render cost during language changes
Observed issues:
- `NewSectionAudioPlayer` is remounted via `key={guideId-language}` which is useful, but expensive if combined with duplicate fetches.
- `ChapterList` renders the full section list every time and language taps may trigger multiple state updates.

Implementation:
- Keep the remount behavior only where it is truly needed for correct audio reset, but avoid triggering it twice from duplicated language-change paths.
- Memoize derived section lookups in `MultiTabAudioPlayer` and stabilize event handlers with `useCallback`.
- Keep stale content visible while new language data loads, instead of clearing first on main guide switches where possible.
- Ensure `GuideLanguageSelector` does not re-fetch languages unnecessarily when only selection changes; fetch only when actual target guide changes.

3. Fix an RPC mismatch likely causing linked-guide fallback overhead
Observed issue:
- `MultiTabAudioPlayer.tsx` calls `get_linked_guide_sections_with_access` using `p_target_guide_id`.
- The useful context shows an older SQL signature using `p_linked_guide_id`, while generated TS types show `p_target_guide_id`.
- This needs verification in implementation to avoid silent fallback to direct table fetches, which is slower and can amplify lag.

Implementation:
- Confirm the current generated client type signature and align the runtime call exactly with it.
- Remove unnecessary fallback database query where RPC already succeeds.
- If fallback is still required, keep it minimal and only for failure cases, not normal flow.

4. Make Admin Content Management update instantly after editing
Observed issue:
- `AdminGuideOrderManager.tsx` fetches guides only once on mount.
- `AdminGuideEditForm.tsx` writes `localStorage.setItem('guide_updated_<id>')`, but the content manager does not listen for it.
- There is also no realtime subscription, so title/location/status edits stay stale until full reload.

Implementation:
- Add a local instant refresh mechanism in `AdminGuideOrderManager.tsx`:
  - listen for the same `storage` event / custom refresh event used elsewhere
  - when a guide is updated, re-fetch guides and collections
- Also add a Supabase realtime subscription for:
  - `audio_guides`
  - optionally `guide_sections` and `guide_collections` if language badges / linked-guide badges must update instantly too
- On INSERT/UPDATE/DELETE, invalidate local list by re-running `fetchGuides()` and `fetchCollections()`
- Clean up subscriptions on unmount

5. Keep it responsive on mobile and safe functionally
- Do not change access logic, purchase logic, or audio permissions.
- Do not remove the current remount protection for audio unless equivalent reset behavior is preserved.
- Preserve linked-guide language sync behavior, but make it lazy and cached instead of eager.

Files to update
- `src/pages/GuideDetail.tsx`
- `src/pages/AudioAccess.tsx`
- `src/components/MultiTabAudioPlayer.tsx`
- `src/components/GuideLanguageSelector.tsx`
- `src/components/AdminGuideOrderManager.tsx`

Expected result
```text
Mobile:
Tap language -> single fetch path -> smoother transition -> less blocking/jank

Admin Content:
Edit guide title/location/status -> close popup -> list refreshes immediately
No manual page refresh needed
```

Technical notes
- Main performance problem is not only rendering; it is duplicated network/data work plus unnecessary remount pressure on mobile.
- Best fix is a combination of:
  1) single owner for language fetches,
  2) lazy linked-guide loading,
  3) per-language cache,
  4) realtime/list refresh for admin content.
