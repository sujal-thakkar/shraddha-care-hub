# Elder-friendly writer accounts + moderated publishing

Two goals in one pass:
1. Replace magic-link auth with **name + phone + 4-digit PIN** for blog writers, gated by admin approval.
2. Make **every blog post require admin approval before it goes live**, and add **social share icons** on the blog reader.

Existing test accounts will be wiped clean.

---

## User-facing flow

**Signup** (`/auth`)
- Fields: Full name, country code + phone (unique), 4-digit PIN, confirm PIN
- After submit: "Your account is being reviewed. We'll let you know once approved."
- Account created with status = `pending`. User cannot log in yet.

**Login** (`/auth`)
- Fields: country code + phone, 4-digit PIN
- If approved → signed in, land on `/blog/write`
- If pending → "Your account is still under review"
- If rejected → "Account not approved. Contact us."

**Writing a blog**
- Same editor as today (autosave, rich toolbar, cover upload — all unchanged).
- Pressing "Publish" now submits for review → status becomes `pending_review`. User sees "Sent for admin review. You'll see it live once approved."
- My Stories page shows each post's status: Draft / Under review / Published / Rejected.

**Reading a blog** (`/blog/:slug`)
- Adds social share row (WhatsApp, Facebook, X, LinkedIn, Copy link) below title — reuses the existing `SocialShare` component from events.

**Admin panel** — new **Writers** tab
- Two sections: Pending writers, All writers
- Approve / Reject buttons; rejection reason optional
- Reset PIN button (for the "I forgot my PIN" case)

**Admin panel** — existing **Blogs** tab, upgraded
- Posts default view shows "Pending review" first
- Approve → status `published` (goes live)
- Reject → status `rejected` with note back to author
- Delete stays as-is

**Admin sidebar badges**
- Small red count next to Writers = pending writer applications
- Small red count next to Blogs = posts awaiting review
- Refreshes on tab focus. No emails.

---

## What gets wiped

- All rows in `auth.users` (test accounts)
- All rows in `profiles`, `blogs`, `blog_ai_suggestions`
- Admin role will be re-seeded: after migration runs, the user creates a new admin account through the new signup form, then I run a one-line insert to grant `admin` role to that user_id.

---

## Technical details

### Auth mechanism
Supabase Auth requires an email under the hood. We map phone → synthetic email so we keep all the session, RLS, and JWT plumbing:

- Synthetic email: `{e164_digits_only}@writers.shraddha.local` (never shown to user, never emailable)
- Password: `{e164}:{pin}` (phone + PIN combined — bcrypt-hashed by Supabase server-side)
- `auto_confirm_email = true` so no email verification step
- Signup disabled in Supabase config for email confirmations; we use `signUp()` server-side flow with confirmed=true via the admin-side of the client? — no: we call `supabase.auth.signUp` with the synthetic email; the `handle_new_user` trigger creates the profile row with `status='pending'`. RLS on `blogs` requires `profiles.status = 'approved'` for insert/update.

### Schema changes (single migration)
- `profiles`: add `phone_e164 TEXT UNIQUE NOT NULL`, `pin_hash TEXT` (optional — Supabase stores the real hash, but we keep a flag), `status TEXT NOT NULL DEFAULT 'pending' CHECK IN (pending, approved, rejected)`, `rejected_reason TEXT`, `approved_at TIMESTAMPTZ`, `approved_by UUID`
- `blogs`: ensure `status` column supports `draft`, `pending_review`, `published`, `rejected`; publish action now sets `pending_review`
- RLS updated:
  - `blogs` INSERT/UPDATE requires `profiles.status = 'approved'` for the author
  - Public SELECT on `blogs` only for `status = 'published'`
  - Admins bypass via `has_role(auth.uid(), 'admin')`
- New RPCs:
  - `check_phone_available(phone TEXT)` — returns bool, used at signup
  - `admin_approve_writer(user_id UUID)`, `admin_reject_writer(user_id UUID, reason TEXT)`, `admin_reset_writer_pin(user_id UUID, new_pin TEXT)` — all `security definer`, gated on `is_admin()`
  - `admin_approve_blog(blog_id UUID)`, `admin_reject_blog(blog_id UUID, reason TEXT)`
- `handle_new_user` trigger updated: reads `phone_e164` and `full_name` from `raw_user_meta_data`, inserts profile with `status='pending'`

### Files to edit
- `src/pages/Auth.tsx` — replace tabs with Login (phone + PIN) and Signup (name + phone + PIN + confirm)
- `src/pages/admin/Dashboard.tsx` — add Writers link with badge, add pending count to Blogs link
- `src/pages/admin/Writers.tsx` — **new** page for pending/approved writer list
- `src/pages/admin/Blogs.tsx` — add Approve/Reject buttons, filter tabs
- `src/pages/BlogWrite.tsx` — publish button copy + status set to `pending_review`
- `src/pages/BlogMyStories.tsx` — show status pill per post
- `src/pages/BlogRead.tsx` — add `<SocialShare>` row
- `src/pages/Blog.tsx` — filter to `status = 'published'` (probably already does; verify)

### Country codes
Reuse the existing `COUNTRY_CODES` array already in `Auth.tsx` (India, US, UK, etc.). Phone is normalized to `+91XXXXXXXXXX` E.164 for the uniqueness check.

### Security notes
- PIN is 4 digits (elder-friendly). Combined with phone in the bcrypt input, brute-force on a stolen hash is still bounded, and admin gates publishing so worst case is a rejected draft. Documented as an accepted tradeoff.
- Rate-limit login attempts client-side (5 failures → 60s cooldown) to slow guessing.
- No email is ever sent — the synthetic domain is non-routable.

---

## Out of scope (not doing)
- SMS OTP (deferred — costs money, user chose not to)
- Password reset by user (admin resets PIN instead)
- Migrating existing accounts (wiping)
- Email notifications to admin (badges only)

Approve this and I'll ship it in one pass.