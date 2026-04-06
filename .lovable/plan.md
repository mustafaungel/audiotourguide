

## Plan: Show All Guides in Admin Content Management

### Problem
`AdminGuideOrderManager.tsx` line 326 filters with `.eq('is_standalone', true)`, hiding 4 guides that have `is_standalone = false` (linked/child guides). Admin needs to see and manage all guides.

### Solution
Remove the `is_standalone` filter and add a visual indicator to distinguish standalone vs linked guides.

### Changes in `src/components/AdminGuideOrderManager.tsx`

1. **Remove filter** — Delete `.eq('is_standalone', true)` from `fetchGuides()` (line 326)
2. **Add `is_standalone` to select** — Include it in the selected columns so we can display a badge
3. **Add visual indicator** — Show a small "Linked" badge next to guides where `is_standalone === false`, so admin can distinguish them from standalone guides
4. **Sorting** — Keep existing sort by `display_order` then `created_at`; linked guides will appear in their natural order

### Files affected

| File | Change |
|------|--------|
| `src/components/AdminGuideOrderManager.tsx` | Remove `is_standalone` filter, add to select, show badge |

