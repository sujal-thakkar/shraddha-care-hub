

## Plan: Dropdown Nav + Events Page + Home Preview

### 1. Navbar Restructure (`src/components/layout/Header.tsx`)

Replace flat nav with grouped dropdowns:

```text
Home    About ▾              Projects & Events ▾    Community ▾    Donate    [Support Us]
        ├─ About Us           ├─ Events (new)        ├─ Volunteer
        └─ Corporate Care     ├─ HPL                 └─ Contact
                              └─ Games
```

- Desktop: hover-triggered dropdown panels with child links
- Mobile: accordion-style — tap parent to expand/collapse children with chevron animation
- Active state on parent when any child route is active

### 2. New Events Page (`src/pages/Events.tsx`)

Full listing of all published events with filter tabs: All | Upcoming | Ongoing | Completed. Uses Layout wrapper, grid display, reuses `ProjectEventCard` styling.

**Database change needed**: Update RLS policy on `projects_events` to allow public viewing of completed events too (current policy excludes `status = 'completed'`).

### 3. Home Page Update (`src/pages/Home.tsx`)

Add `ProjectsEventsSection` with `limit={3}` between the Impact Gallery section and the Corporate Care CTA section. Include an "Explore All Events" button linking to `/events`.

### 4. ProjectsEventsSection Enhancement (`src/components/corporate/ProjectsEventsSection.tsx`)

- Add optional `limit` prop — applies `.limit(n)` to the query
- Add optional `showViewAll` prop — renders "Explore All Events →" CTA linking to `/events`
- Add `id="events"` to section root

### 5. Corporate Care Cleanup (`src/pages/CorporateCare.tsx`)

- Remove `<ProjectsEventsSection />` (line 348)
- Add a compact inline link before the CTA: "See our latest projects & events →" pointing to `/events`

### 6. Route Registration (`src/App.tsx`)

Add lazy-loaded `/events` route.

### Files Summary

| File | Action |
|------|--------|
| `src/components/layout/Header.tsx` | Rewrite — dropdown groups, mobile accordion |
| `src/pages/Events.tsx` | Create — full events listing with filters |
| `src/pages/Home.tsx` | Add events preview section |
| `src/components/corporate/ProjectsEventsSection.tsx` | Add `limit` + `showViewAll` props |
| `src/pages/CorporateCare.tsx` | Remove section, add teaser link |
| `src/App.tsx` | Add `/events` route |
| Database migration | Update RLS to allow viewing completed events publicly |

