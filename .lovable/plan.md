## Goal

Retire the one-off Mumbai Health Camp page and turn it into a reusable registration system. Admins create events from the dashboard; each event gets its own public registration page; registrations and emails work exactly like before but are scoped per-event. No code changes needed when a new event comes or goes.

## Database

New table `public.registration_events`:
- `slug` (unique, used in the URL), `title`, `description`
- `event_date`, `start_time`, `end_time`
- `venue_name`, `venue_address`, `contact_phone`
- `banner_url` (optional image)
- `field_config` (JSONB) — per-field `{ enabled, required }` for the toggleable fields: mobile, age, area, medical_concerns, source. (Name + email are always on.)
- `registration_open` (boolean), `is_published` (boolean), `display_order`
- standard id/created_at/updated_at + update trigger
- RLS: public can read published events; admins manage all. GRANTs for anon (read published), authenticated, service_role.

Alter `public.event_registrations`:
- Add `event_id` UUID referencing `registration_events`.
- Backfill: create one "Mumbai Senior Citizens' Health Camp" event row and attach all existing registrations to it, so old data stays visible.

## Public pages

- Remove `/mumbai-health-camp` route and `MumbaiHealthCamp.tsx` (plus its now-unused assets/components).
- Add `/register` — lists open events (cards). If only one is open, it can deep-link straight in.
- Add `/register/:slug` — dynamic registration page: shows event details (date, time, venue, banner) and renders only the enabled fields with the configured required flags. Submits to `event_registrations` with `event_id`, then triggers the confirmation email.
- Keep a redirect from `/mumbai-health-camp` to the Mumbai event's `/register/:slug` so old links don't break.

## Admin

- New dashboard section "Events" (manage registration events): create/edit/delete, set details, toggle which fields appear/are required, open/close registration, publish, upload banner.
- Registrations page: add an event selector (dropdown). Stats, search, check-in, CSV export, and the bulk email actions all scope to the selected event.

## Emails (edge function `send-event-email`)

- Accept `eventId` and load that event's details from `registration_events`.
- Build confirmation / reminder / thank-you / missed-followup templates dynamically from the event's title, date, time, venue, and phone (no hardcoded Mumbai text).
- Bulk queries filter by `event_id`.

## Notes

- Field set stays fixed (toggle on/off per event) per your choice; emails auto-fill from event details.
- Existing Mumbai registrations are preserved and attached to the seeded Mumbai event.

I'll implement DB first, then the public pages, admin, and edge function.