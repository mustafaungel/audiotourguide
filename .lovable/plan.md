

## Plan: Move Create Guide into Content Tab, Remove Create Tab

### What changes

**Goal:** Add a "+ Create New Guide" button to the Content Management area so admins can create guides directly from the Content tab. Remove the separate "Create" tab since it becomes redundant.

### Changes

**`src/pages/AdminPanel.tsx`:**
1. Remove the `Create` `TabsTrigger` (lines 422-425)
2. Remove the `<TabsContent value="create-guide">` block (lines 468-734)
3. Move all the create-guide form content into a new state-toggled view inside the `content-management` TabsContent — when `showCreateForm` is true, show the create form; otherwise show the guide list

**`src/components/AdminGuideOrderManager.tsx`:**
1. Add an `onCreateNew` optional prop
2. Render a "+ Create New Guide" button at the top of the content list that calls `onCreateNew`

### Result in Content tab

```text
Content Management
[+ Create New Guide]        ← new button
[drag-sortable guide list]

--- when clicked ---

Content Management
[← Back to List]
[Create Audio Guide form]   ← moved from Create tab
```

### Tab bar after change

```text
Dashboard | Content | Contact | Email | Analytics | Reviews | Preview
```

### Files affected

| File | Change |
|------|--------|
| `src/pages/AdminPanel.tsx` | Remove Create tab, integrate create form into content-management tab with toggle |
| `src/components/AdminGuideOrderManager.tsx` | Add `onCreateNew` prop and create button |

