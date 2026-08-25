# Fix guest blog submit: Membership ID + password instead of PIN

Guest writing still asks for a 4-digit PIN when the phone number already belongs to an account. That path predates the Membership ID + password login, so returning writers/members get stuck (most have no PIN at all).

## What the user will see

Step 1 stays the same: name + country code + phone.

Then, based on the phone:

1. **Phone already belongs to an account** — "Welcome back" step asks for **Membership ID + password** (the same credentials as the website sign-in), with the existing **"Use my PIN instead"** fallback link for old writers who still have one. On success the blog is attached to that account (`author_id`), and marked non-guest if the profile is approved.
   - If the account exists but has no credentials yet (pending / no password issued), show a clear message: the blog is submitted now and will be linked automatically once the office issues their Membership ID — no password needed.
2. **New phone** — no PIN creation any more. Two choices:
   - **Request a writer account** — creates the pending account (same as the site's "Create account" flow, no password chosen by the user) and attaches this blog to it; the office issues the Membership ID + password later.
   - **Submit as a one-time guest** — unchanged.
3. Success screens: PIN wording removed. For linked/pending accounts the CTA becomes "Browse blogs" plus a line explaining that the Membership ID and password arrive from the office; the auto-sign-in-with-PIN button is dropped.

The intro card on the guest writing page is reworded to match (no "set a PIN" copy).

## Technical notes

- `src/components/blog/GuestSubmitDialog.tsx`: replace the `existing-pin` step with a credentials step that calls the existing `member-login` edge function (`membership_id` + `password`), then `supabase.auth.setSession(...)`. Verify the signed-in profile's `phone_e164` last-10 digits match the phone entered; mismatch → clear error, no insert. Insert the blog while signed in (RLS needs `auth.uid() = author_id`), then sign out as today. Keep the PIN sub-form behind a "Use my PIN instead" toggle using the current `signInWithPassword` logic.
- Replace `new-pin` step with a "request account / stay guest" step reusing `Auth.tsx`'s signup approach: `signUp` with a random placeholder password and `full_name` / `phone_e164` / `country_code` metadata, insert the blog as `is_guest: true` with `author_id` set, then sign out. Existing `admin_approve_writer` already flips those rows to non-guest on approval, so nothing changes server-side.
- Pending-account detection keeps using `get_writer_status_by_phone`; add a lookup for whether a Membership ID exists for that phone so the dialog can choose "ask for credentials" vs "submitted, will link later". This needs a small security-definer RPC (e.g. `guest_account_hint(_phone)`) returning `status` and `has_membership_id` only — no personal data, no phone echo.
- `src/pages/BlogWriteGuest.tsx`: update the "how it works" list copy; submit handler logic unchanged.
- No schema changes to `blogs`; no changes to admin review flow.
