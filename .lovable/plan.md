

## Plan: Remove Languages Tab from Admin Panel

The Languages tab (`AdminLanguageManagement`) is redundant since language/translation management is already handled within the Edit form's Sections manager.

### Changes

**`src/pages/AdminPanel.tsx`:**
1. Remove the `import AdminLanguageManagement` line
2. Remove the `Languages` `TabsTrigger` button (around line 429-432)
3. Remove the `<TabsContent value="language-management">` block (around lines 743-745)
4. Remove the `Languages` import from lucide-react if no longer used elsewhere

**No other files affected.** `AdminLanguageManagement.tsx` file stays in the codebase (unused) — can be deleted for cleanup.

| File | Change |
|------|--------|
| `src/pages/AdminPanel.tsx` | Remove Languages tab trigger, content, and import |
| `src/components/AdminLanguageManagement.tsx` | Delete file (cleanup) |

