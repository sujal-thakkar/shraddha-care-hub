

## Plan: Dropdown Navigation & Events Page

### Overview
Restructure navigation with hover dropdowns and create a dedicated Events page. Keep Corporate Care distinct with a preview card on Home page.

---

### Navigation Structure

```text
Home    About ▾         Projects & Events ▾    Community ▾    Donate    [Support Us]
        ├─ About Us      ├─ Events (new)        ├─ Volunteer
        └─ Corporate     ├─ HPL                 └─ Contact
           Care          └─ Games
```

---

### File Changes

| File | Action |
|------|--------|
| `src/pages/Events.tsx` | **Create** — Full events listing with filter tabs (All/Upcoming/Ongoing/Completed) |
| `src/App.tsx` | Add `/events` route (lazy loaded) |
| `src/components/layout/Header.tsx` | Rewrite nav with dropdown groups (desktop hover, mobile accordion) |
| `src/pages/Home.tsx` | Add `ProjectsEventsSection` preview (3 items max) + "View All Events" CTA |
| `src/components/corporate/ProjectsEventsSection.tsx` | Add `limit` prop + `id="events"` anchor |
| `src/pages/CorporateCare.tsx` | Remove full section, add small teaser link to `/events` |

---

### Implementation Details

**1. Header.tsx — Dropdown Navigation**
- Replace flat `navItems` array with grouped structure:
  ```typescript
  const navGroups = [
    { name: "Home", path: "/" },
    { 
      name: "About", 
      children: [
        { name: "About Us", path: "/about" },
        { name: "Corporate Care", path: "/corporate-care" }
      ]
    },
    { 
      name: "Projects & Events", 
      children: [
        { name: "Events", path: "/events" },
        { name: "HPL", path: "/hpl" },
        { name: "Games", path: "/games" }
      ]
    },
    { 
      name: "Community", 
      children: [
        { name: "Volunteer", path: "/volunteer" },
        { name: "Contact", path: "/contact" }
      ]
    },
    { name: "Donate", path: "/donate" }
  ];
  ```
- Desktop: hover triggers dropdown panel with child links
- Mobile: accordion-style expansion on tap, chevron toggles

**2. Events.tsx — Dedicated Page**
- Filter tabs: All | Upcoming | Ongoing | Completed
- Grid layout showing all published events
- Reuse existing query logic from `ProjectsEventsSection`
- No date limit—show all historical events too

**3. Home.tsx — Preview Section**
- Import `ProjectsEventsSection` with `limit={3}` prop
- Place after Impact Gallery section
- Add "Explore All Events →" button linking to `/events`

**4. ProjectsEventsSection.tsx — Add Props**
- Add optional `limit?: number` prop
- Apply `.limit(limit)` to Supabase query when provided
- Add `id="events"` to section root for anchor linking

**5. CorporateCare.tsx — Clean Up**
- Remove `<ProjectsEventsSection />` import and render
- Add small inline teaser: "See our latest projects & events →" linking to `/events`

---

### Mobile Behavior
- Header dropdowns become collapsible accordions
- Each parent item shows chevron icon
- Tap expands/collapses child links inline
- Close mobile menu on any link click (existing behavior)

