

## Plan: Dialog-Based Create/Edit + Fix Turkish Labels

### Problem
1. Turkish labels remain in admin system UI (e.g., "Guide Sıralaması", "Yeni Guide", "Kaydet", "Düzenle", "Önizle", "Gizle/Yayınla", tooltip texts, toast messages)
2. Create form takes over the entire Content tab — should open as a Dialog/popup instead
3. Edit button navigates away to a separate tab — should also open as a Dialog/popup

### Changes

**`src/components/AdminGuideOrderManager.tsx`:**
1. Fix all Turkish labels to English:
   - "Guide Sıralaması" → "Guide Order"
   - "Yeni Guide" → "+ New Guide"
   - "Kaydet" → "Save"
   - "Henüz guide eklenmemiş" → "No guides yet"
   - "Düzenle" tooltip → "Edit"
   - "Önizle (Audio Access)" → "Preview (Audio Access)"
   - "Gizle" / "Yayınla" → "Hide" / "Publish"
   - "Bağlı:" → "Linked:"
   - "Bağlı guide yok" → "No linked guides"
   - "Erişim:" → "Access:"
   - "Erişim linki kopyalandı" → "Access link copied"
   - "Detay:" → "Detail:"
   - "Bu guide için erişim kodu yok" → "No access code for this guide"
   - "Durum güncellenemedi" → "Failed to update status"
   - All toast messages → English
2. Change `handleEdit` to call an `onEdit(guideId)` prop instead of dispatching `admin-edit-guide` event

**`src/pages/AdminPanel.tsx`:**
1. Fix Turkish label "← Guide Listesine Dön" → "← Back to List"
2. Remove `showCreateForm` state toggle — replace with Dialog-based approach
3. Add state: `createDialogOpen` (boolean) and `editDialogGuideId` (string | null)
4. Wrap Create form in a `<Dialog>` that opens when "+ New Guide" is clicked
5. Wrap Edit form (`AdminGuideEditForm`) in a `<Dialog>` that opens when Edit is clicked on any guide
6. Remove the separate `edit-guide` TabsTrigger and TabsContent — edit now happens in dialog
7. Remove the `admin-edit-guide` event listener — replaced by direct prop callback
8. Pass `onEdit` callback to `AdminGuideOrderManager` that sets `editDialogGuideId`

**`src/components/AdminGuideEditForm.tsx`:**
1. Add optional `guideId` prop so the parent can pass which guide to edit directly (instead of relying on sessionStorage)
2. Add optional `onClose` prop for dialog dismiss

**`src/components/AdminMobileNavigation.tsx`:**
1. Remove `edit-guide` from the mobile nav tabs array (no longer a separate tab)

### Result

```text
Tab bar: Dashboard | Content | Contact | Email | Analytics | Reviews | Preview

Content tab:
  [+ New Guide]  [Save]
  [guide list...]
  
  Click "+ New Guide" → Full-screen dialog with create form
  Click Edit on guide → Full-screen dialog with edit form
```

### Files affected

| File | Change |
|------|--------|
| `src/components/AdminGuideOrderManager.tsx` | All Turkish→English, add `onEdit` prop |
| `src/pages/AdminPanel.tsx` | Dialog for create/edit, remove Edit tab, fix Turkish |
| `src/components/AdminGuideEditForm.tsx` | Accept `guideId` prop, add `onClose` prop |
| `src/components/AdminMobileNavigation.tsx` | Remove edit-guide from tabs |

