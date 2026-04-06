
## Plan: Move Preview Into Admin Panel Tab

### Problem
The Preview tab in admin panel uses `navigate('/admin/preview')` which leaves the admin panel entirely, losing all tabs and navigation context. The user can't go back to other tabs.

### Solution
Embed the preview functionality directly as a `TabsContent` within the admin panel, like all other tabs.

### Changes

**`src/pages/AdminPanel.tsx`:**
1. Remove the `onClick={() => navigate('/admin/preview')}` from the Preview `TabsTrigger` (line 429)
2. Add a new `<TabsContent value="preview">` block that renders the preview UI inline (guide selector, mobile/desktop toggle, iframe, checklist)
3. Import necessary components (`CheckCircle2`, `XCircle`, `Smartphone`, `Monitor`) from lucide-react
4. Move the guide-fetching logic and preview state into this tab content (can use a lightweight inline component or extract to a new `AdminPreviewTab` component)

**`src/pages/AdminPreview.tsx`:**
- Keep the file but it becomes unused (or delete for cleanup). The `/admin/preview` route can remain as a fallback or be removed from `App.tsx`.

### Result
Preview behaves like every other admin tab — clicking it shows preview content in the same panel, all other tabs remain accessible.

### Files affected

| File | Change |
|------|--------|
| `src/pages/AdminPanel.tsx` | Remove navigate onClick, add TabsContent with preview UI |
| `src/pages/AdminPreview.tsx` | Delete (cleanup) |
| `src/App.tsx` | Remove `/admin/preview` route (cleanup) |
