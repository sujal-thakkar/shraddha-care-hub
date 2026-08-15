# Hosla Membership Platform — Phase 1 (Membership ID login, member ledger, cash & UPI workflows, RBAC)

Building the enterprise membership foundation from your design docs in one coherent phase. Renewals, dunning, analytics, SMS/DLT and 2FA stay for the next phase.

## Decisions locked from your answers
- **One unified account for everyone** (member, writer, volunteer, admin) — the blog no longer has its own login or separate path; everything lives in one synchronous profile.
- Login is **Membership ID + password**. Passwords are issued and managed by admins, not self-registered.
- No OTP / DLT SMS in this phase.
- Fee engine is a **monthly ledger** (fee amount per member + "paid up until" date). The Standard/Premium plan prices only set the default monthly amount.
- Stripe stays as the online gateway for now; the design is webhook-first so Razorpay can drop in later.
- Existing members are imported from **both** the Active Members sheet and approved membership applications into an admin review screen where each record is confirmed before activation.

## 1. Login with Membership ID + password
- Sign-in screen: **Membership ID** box + **Password** box and one big "Sign in" button. The existing "Use my PIN instead" option stays available so current writers are not locked out.
- Membership ID is generated automatically: first four letters of the name + last four digits of the phone (e.g. RINA1234). Shown prominently on the profile so members can read it back.
- Admin panel can set, reset and re-issue a member's password at any time; new-member onboarding is ID + password only (no self-signup).
- Sensible protections: attempt throttling and lockout after repeated wrong passwords, and a forced password change prompt the first time a member signs in with an admin-issued password.


## 2. Member records and the fee ledger
Each member gets: membership number (first four letters of the member's name + last four digits of their phone, e.g. RINA1234), plan, monthly fee amount, paid-up-until date, city chapter, join date, status (active / renewal due / lapsed) with a 15-day grace buffer.

A single transactions ledger records every rupee with its source and state:
- `stripe` → success immediately (confirmed by webhook, not the redirect page).
- `direct_upi` → pending_verification (member/child reported it).
- `cash` → pending_approval (volunteer collected it), then settled.
- Plus rejected, with the reason.

Approving a transaction is what extends the paid-up-until date. Months covered are computed from amount ÷ monthly fee, so ₹600 on a ₹300 plan reads "April–May" before anyone confirms. Every state change is written to an audit log with who did it and when. Duplicate submissions for the same member and month are blocked.

## 3. The three payment workflows
**A. Online (Stripe)** — member pays from their profile; a `stripe-webhook` function marks the transaction paid and extends validity even if the browser is closed. A downloadable receipt link is stored.

**B. "I paid directly on PhonePe/GPay" (member or their child)** — simple form: amount, date, paid by self/someone else, optional transaction ID, and an **optional** screenshot upload. Creates pending_verification and shows a clear "Waiting for admin approval" badge. Any uploads go to a new private bucket.

**C. Cash collected in person** — a deliberately tiny form with **three fields only**: member name (search-as-you-type), amount, and receiver name (pre-filled with the signed-in collector, editable when someone else handed it over). Everything else is auto-filled and shown read-only for confirmation: membership ID, plan, monthly fee, and the months the amount covers ("₹600 covers April–May, new paid-until 31 May"). One "Record collection" button. The entry is created as pending_approval, the member instantly gets an in-app receipt, and the amount sits in that receiver's floating-cash balance until the main admin settles it.

## 4. Two admin surfaces: shared team panel + separate main-admin console
Your shared-laptop reality changes the answer, so we'll do both layers rather than pick one:

- **`/admin` — team panel (shared).** Keeps the existing sign-in exactly as it is. Any team-member admin account can use it, and a shared office login is fine. Content management, member lookup, cash recording, fee reminders, own settlement balance. No per-person profiling required.
- **`/admin/hq` — main-admin console (separate route, not linked anywhere).** Not listed in navigation or sitemap. Reaching it requires **both** the `main_admin` role on the signed-in account **and** a separate console passphrase entered on arrival, which unlocks a short session (30 min idle timeout, cleared on tab close). So on the shared laptop, a main admin signs in as usual, opens the console URL, enters the passphrase, does the sensitive work, and closes it — basic team members can't get in even from the same browser.

To be straight with you: the hidden URL itself adds close to zero security (URLs leak), and a passphrase alone would be weak because it's shared and never rotated. What makes this safe is the **role check enforced server-side** in RLS and edge functions — the console is a convenience/segregation layer on top, and the passphrase is the shared-laptop lock. Every sensitive action is also audit-logged with actor, time and IP, so a shared login still leaves a trail.

Roles stay in `user_roles`: `member`, `team_admin`, `main_admin`.

| Action | `/admin` team panel | `/admin/hq` main console |
| --- | --- | --- |
| Content: blogs, events, messages, reports, donations, routine, newsletters, team, subscribers | Yes | — (stays in team panel) |
| View members, plans, paid-until status | Yes | Yes |
| Record cash collection (3-field form) | Yes → pending approval | Yes, self-approved |
| Approve / reject cash entries | No | Yes |
| Approve / reject direct-UPI reports | View only | Yes |
| Cash settlement | Sees own balance | Yes, for every collector |
| Send fee reminders | Yes | Yes |
| Create member accounts | Yes | Yes |
| Set / reset member passwords | Raises a request | Yes, unrestricted |
| Change fee amounts, edit paid-until, reverse payments | No | Yes (audit-logged) |
| Assign or remove roles, ban accounts | No | Yes |
| Import / activate memberships | Prepare only | Yes, approves |
| Audit log | Own actions | Everything |

## 5. Admin panel additions
- **Members**: searchable list with plan, fee, paid-until, status, membership ID; detail view with full payment timeline, blogs written, events attended.
- **Credentials**: create a member account (ID auto-generated), set or reset the password, copy it to share, force a password change on next sign-in. A team-member admin's reset creates a **pending request** the main admin approves; the main admin acts directly.
- **Fee reminders**: filter members who are due or lapsed, preview the message, select recipients (or all due) and send. Delivered by email plus an in-app notification now; the same screen will send SMS once DLT is live in phase 2. Reminder history is logged per member so nobody gets spammed twice in a day.
- **Verification queue**: direct-UPI reports with the screenshot when one was attached; approve or reject with reason.
- **Cash & settlement**: pending cash entries for the main admin to approve, and per-collector outstanding balances with a "Settle" action.
- **Import review**: merged list from the Active Members sheet and approved applications; admin sets fee amount and paid-until date, then activates.
- **Audit log**: read-only trail of every money, credential and role action.

## 6. Member profile as a "living room" (not a dashboard)
Rebuilt `/profile` for elders: big "Namaste {name}" header with photo and a green/orange membership badge, then Membership (vertical month timeline showing "Paid via Amit on 12 Aug", pay/report buttons), My Stories, and My Events with the next event's pass. Minimum 18px text, 56px tap targets, static bold labels above inputs, works in English and Bengali.

## Technical notes
- Migration adds: member fields on profiles (membership_id, plan, monthly_fee_amount, paid_up_until, chapter, member_status, must_change_password), `transactions`, `fee_audit_log`, `member_imports`, `credential_requests`, `fee_reminders`; new `team_admin` and `main_admin` values on `app_role` plus `is_main_admin()` / `is_team_admin()` helpers; RLS so members read only their own transactions and insert only direct-UPI reports, team admins insert cash entries and read members, main admins manage all — with GRANTs on every new table.
- Auth keeps the existing Supabase synthetic-email pattern: the membership ID maps to a deterministic internal email, so `signInWithPassword` works unchanged and the current PIN path keeps functioning. A `member-credentials` edge function (service role) creates accounts and sets/resets passwords, re-checking the caller's role server-side and enforcing the request/approval rule for team admins.
- Other new edge functions: `stripe-webhook`, `create-membership-checkout`, `record-cash-collection`, `import-members`, `send-fee-reminders`. Stripe webhook needs a `STRIPE_WEBHOOK_SECRET`.
- Frontend: `src/pages/Auth.tsx` becomes the single unified sign-in (Membership ID + password, PIN fallback) and `/admin/login` reuses it; the blog's separate auth entry points redirect there. `src/pages/Profile.tsx` rebuilt; the admin layout in `src/pages/admin/Dashboard.tsx` becomes role-aware so unauthorised nav items and routes never render; new admin pages under `src/pages/admin/` (Members, MemberCredentials, FeeReminders, Verifications, CashSettlement, MemberImport, AuditLog); a reusable step-up re-auth dialog; shared elder-mode type/spacing tokens; TanStack Query persistence so a cash entry survives a dropped signal.

## Explicitly deferred to phase 2
DLT SMS + OTP login, SMS reminders and broadcasts, automatic recurring renewal charges and dunning schedules, Razorpay swap, 2FA, deep analytics dashboards, event photo "Memories", PWA install prompt for field collection.
