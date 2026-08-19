# Clean up the Active Members sheet panel

The synced Google Sheet list currently appears twice in the admin panel. It stays in "Add from sheet" and disappears from "Card applications", which will then show only real membership-card applications from the website.

## Changes

1. **Card applications tab** (`src/pages/admin/Memberships.tsx`)
   - Remove the `ActiveMembersSync` panel and its import. The tab keeps its heading, filters and the applications table only.

2. **Add from sheet tab** (`src/components/admin/SheetOnboarding.tsx`)
   - Add "Open sheet" and "Sync now" actions to the card header, next to the existing Refresh / Create buttons.
   - "Open sheet" links to the same Google Sheet URL used today.
   - "Sync now" calls the existing `sync-active-members` edge function, shows a spinner while running, toasts the synced/skipped counts, then reloads the pending list so newly synced people appear immediately.
   - Show a small "Last synced <date time>" line under the title, taken from the newest `synced_at` in `active_members`.

3. Keep `src/components/admin/ActiveMembersSync.tsx` as an unused component or delete it — it is no longer referenced anywhere after step 1. Plan: delete it to avoid dead code.

## Notes

No database or edge-function changes; this is UI wiring plus reuse of the existing sync function.
