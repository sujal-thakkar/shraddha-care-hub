## Goal

Today there are two disconnected systems:

- **`projects_events`** → shown on Home (`ProjectsEventsSection`) and `/events`, managed in admin "Projects & Events".
- **`registration_events`** → shown on `/register` + `/register/:slug`, managed in admin "Manage Events", and is what registrations + confirmation emails attach to.

Because they're separate, the **Belur Math** event (only in `registration_events`) is open for registration but missing from Home and `/events`. And "Senior Serenity Summit" / "Mumbai Health Camp" exist as duplicates in both tables.

We'll make **`registration_events` the single source of truth**. One detailed entry will drive Home, `/events`, and `/register`. Admin gets **one** "Events" section.

## Database (one migration)

Extend `public.registration_events` with the display fields currently only on `projects_events`:

- `status` (`project_status` enum: upcoming / ongoing / completed) — default `upcoming`
- `organization` (`organization_type` enum: shraddha / hosla / both) — default `shraddha`
- `resource_link` (text, nullable) — optional "Know More" link
- `end_date` (date, nullable)
- `location` (text, nullable) — short display location for cards
- `enable_registration` (boolean, default false) — whether this event accepts sign-ups

Keep the existing `banner_url` as the single event image (no second image column).

Data moves:
- Enrich the 3 existing `registration_events` rows with sensible `status` / `organization` (Mumbai → completed/both, Senior Serenity → upcoming, Belur Math → upcoming) and set `enable_registration = true` for the two currently open.
- Migrate the only non-duplicate project — **HOSLA PREMIER LEAGUE** — into `registration_events` (status completed, `resource_link = /hpl`, `enable_registration = false`).
- Drop the now-redundant `projects_events` table.

GRANTs/RLS stay as they already are on `registration_events` (public reads published; admins manage all).

## Visibility rules (single table)

- **Home + `/events`**: `is_published = true`. Home/section keep showing non-completed; `/events` keeps its status filter tabs.
- **`/register` list**: `is_published = true` AND `enable_registration = true` AND `registration_open = true`.
- **Card CTA**: if registration is enabled & open → "Register" button → `/register/:slug`; else if `resource_link` set → "Know More" / "Learn More"; else no button.

## Frontend changes

- `src/components/corporate/ProjectsEventsSection.tsx` (Home) — read from `registration_events`; map `banner_url` to the card image; add Register CTA logic.
- `src/pages/Events.tsx` — read from `registration_events`; same card/CTA logic; keep status tabs.
- `src/pages/Register.tsx` / `src/pages/EventRegistration.tsx` — already on `registration_events`; just add the `enable_registration` filter to the list.
- Type references switch from `projects_events` Row to `registration_events` Row (regenerated after migration).

## Admin changes

- Merge into **one** section. Expand `EventManagement.tsx` into the unified editor with grouped fields:
  - **Details**: title, slug, image, description, status, organization, date + end date, location, resource link, display order, published.
  - **Registration** (collapsible, gated by an `enable_registration` toggle): start/end time, venue name + address, contact phones, per-field config, registration open.
- List view shows status + whether registration is on, with the copy-link and preview actions.
- Remove the old **Projects & Events** admin page (`ProjectsEvents.tsx`), its route in `Dashboard.tsx` nav, and its lazy route in `App.tsx`. Keep the "Registrations" page (its event dropdown already uses `registration_events`).

## Notes

- `send-event-email` edge function already loads from `registration_events` — unaffected.
- Old `/mumbai-health-camp` redirect stays working.
- After the migration runs and types regenerate, I'll update all the frontend/admin code in one pass and verify the build, Home, `/events`, and `/register` all show Belur Math.
