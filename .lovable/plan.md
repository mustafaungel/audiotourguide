

## Plan: Fix Language Accordions + Content List Truncation

### Issue 1: Language sections open by default in Edit dialog
In `src/components/AudioGuideSectionManager.tsx` line 753, the Accordion uses `defaultValue={languages}` which opens ALL language groups. Change to `defaultValue={[]}` so they start collapsed.

### Issue 2: Location text truncated in Content list
In `src/components/AdminGuideOrderManager.tsx` line 138, `max-w-[100px]` causes location to show as "Cappadocia, T...". Increase to `max-w-[180px]` for desktop visibility.

### Files affected

| File | Change |
|------|--------|
| `src/components/AudioGuideSectionManager.tsx` | Line 753: `defaultValue={languages}` → `defaultValue={[]}` |
| `src/components/AdminGuideOrderManager.tsx` | Line 138: `max-w-[100px]` → `max-w-[180px]` |

