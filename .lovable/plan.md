

## Plan: Fix Edit Dialog Collapsibles + Consolidate Dashboard Tabs

### Issue 1: Edit Dialog — All Collapsibles Open
When opening the edit popup, all Collapsible sections (Basic Info, Description, URL & Slug, Images, Linked Guides, QR Code) have `defaultOpen` or no `defaultOpen` attribute — they all render expanded, making the dialog cluttered. Additionally, the two-column grid layout (`lg:grid-cols-2`) doesn't work well inside a dialog.

**Fix in `src/components/AdminGuideEditForm.tsx`:**
- Set only "Basic Info" as `defaultOpen={true}`, ensure all others have `defaultOpen={false}` (explicit)
- When rendered inside a dialog (detected via `propGuideId` being set), use a single-column layout instead of `lg:grid-cols-2`
- Hide the guide selector card and back button when `propGuideId` is provided (already done, just verify)

### Issue 2: Dashboard — Consolidate Tabs as Collapsible Dropdowns
Move Contact, Email, Analytics, Reviews, and Preview into collapsible sections within the Dashboard tab. This reduces the tab bar from 7 items to 2 (Dashboard + Content).

**Changes in `src/pages/AdminPanel.tsx`:**
1. Remove `TabsTrigger` entries for: contact-management, email-test, analytics, review-management, preview
2. Remove their corresponding `TabsContent` blocks
3. Update `TabsList` from `grid-cols-7` to `grid-cols-2`

**Changes in `src/components/AdminDashboard.tsx`:**
1. Import and render the 5 components (AdminContactManagement, EnhancedEmailTesting, AdminAnalyticsManager, AdminReviewManagement, AdminPreviewTab) as Collapsible sections, similar to the existing QR Code dropdown pattern
2. Each section gets a Card with a Collapsible trigger showing icon + label

**Changes in `src/components/AdminMobileNavigation.tsx`:**
1. Remove the 5 tab entries (contact-management, email-test, analytics, review-management, preview) — only keep dashboard and content-management

### Result

Tab bar:
```text
Dashboard | Content
```

Dashboard page:
```text
Dashboard Overview
[Stats cards: Total Guides, Revenue, Monthly Revenue]

▸ QR Code Management
▸ Contact Management
▸ Email System
▸ Analytics
▸ Review Management
▸ Preview
```

### Files affected

| File | Change |
|------|--------|
| `src/components/AdminGuideEditForm.tsx` | Collapse all sections by default except Basic Info; single-column in dialog mode |
| `src/components/AdminDashboard.tsx` | Add 5 collapsible sections for Contact, Email, Analytics, Reviews, Preview |
| `src/pages/AdminPanel.tsx` | Remove 5 tabs, keep only Dashboard + Content, update grid |
| `src/components/AdminMobileNavigation.tsx` | Remove 5 entries, keep dashboard + content-management |

