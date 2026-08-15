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

**C. Cash collected by a volunteer** — the *receiver* records it, never the elder. Volunteer searches the member by name, membership ID or phone (fuzzy search), sees "Rina is on the ₹300 plan; ₹600 covers April–May", confirms, and the member instantly gets an in-app receipt in their profile (email receipt where an address exists; SMS receipt comes with the phase-2 DLT work). The amount lands in that volunteer's floating-cash balance until a main admin settles it.

## 4. RBAC: one panel, role-scoped views (recommended over a hidden route)
A separate secret URL is weak protection — anyone who learns the link only needs a password, and it forces us to maintain two panels. The stronger and simpler answer is **one `/admin` panel where the navigation and every server action are scoped to the signed-in role**, so a volunteer literally cannot see or call a main-admin feature even by typing the URL. Roles: `member`, `volunteer`, `team_member`, `admin`, `main_admin`, stored in `user_roles` (never on the profile).

| Action | Team member | Volunteer | Admin | Main admin |
| --- | --- | --- | --- | --- |
| Content (blogs, events, messages) | Yes | No | Yes | Yes |
| Record cash collection | No | Yes (pending approval) | Yes (pending approval) | Yes (self-approved) |
| Approve direct-UPI reports | No | View only | No | Yes |
| Settle volunteer cash | No | View own balance | View only | Yes |
| Set / reset member passwords | No | No | Request only (needs main-admin approval) | Yes, unrestricted |
| Change fees, delete payments, manage roles | No | No | No | Yes (audit-logged) |
| Send fee reminders | No | No | Yes | Yes |

Extra protection for main-admin actions, instead of obscurity: a **step-up re-authentication** prompt (re-enter password) before any money, role or credential action, a short idle timeout on those screens, and every action written to the audit log with actor, time and IP. Membership, settlement, credential and role screens simply do not render for other roles.

## 5. Admin panel additions
- **Members**: searchable list with plan, fee, paid-until, status, membership ID; detail view with full payment timeline, blogs written, events attended.
- **Credentials**: create a member account (ID auto-generated), set or reset the password, copy it to share, force a password change on next sign-in. A normal admin's reset creates a **pending request** the main admin approves; the main admin acts directly.
- **Fee reminders**: filter members who are due or lapsed, preview the message, select recipients (or all due) and send. Delivered by email plus an in-app notification now; the same screen will send SMS once DLT is live in phase 2. Reminder history is logged per member so nobody gets spammed twice in a day.
- **Verification queue**: direct-UPI reports with the screenshot when one was attached; approve or reject with reason.
- **Cash & settlement**: pending cash entries to approve, and per-volunteer outstanding balances with a "Settle" action.
- **Import review**: merged list from the Active Members sheet and approved applications; admin sets fee amount and paid-until date, then activates.
- **Audit log**: read-only trail of every money, credential and role action.

## 6. Member profile as a "living room" (not a dashboard)
Rebuilt `/profile` for elders: big "Namaste {name}" header with photo and a green/orange membership badge, then Membership (vertical month timeline showing "Paid via Amit on 12 Aug", pay/report buttons), My Stories, and My Events with the next event's pass. Minimum 18px text, 56px tap targets, static bold labels above inputs, works in English and Bengali.

## Technical notes
- Migration adds: member fields on profiles (membership_id, plan, monthly_fee_amount, paid_up_until, chapter, member_status, must_change_password), `transactions`, `fee_audit_log`, `member_imports`; new `volunteer` and `main_admin` values on `app_role`; RLS so members read only their own transactions and insert only direct-UPI reports, volunteers insert cash entries, main admins manage all — with GRANTs on every new table.
- Auth keeps the existing Supabase synthetic-email pattern: the membership ID maps to a deterministic internal email, so `signInWithPassword` works unchanged and the current PIN path keeps functioning. A `member-credentials` edge function (service role, main-admin only) creates accounts and sets/resets passwords.
- Other new edge functions: `stripe-webhook`, `create-membership-checkout`, `record-cash-collection`, `import-members`. Stripe webhook needs a `STRIPE_WEBHOOK_SECRET`.
- Frontend: `src/pages/Auth.tsx` becomes the single unified sign-in (Membership ID + password, PIN fallback) and `/admin/login` reuses it; the blog's separate auth entry points redirect there. `src/pages/Profile.tsx` rebuilt; new admin pages under `src/pages/admin/` (Members, MemberCredentials, Verifications, CashSettlement, MemberImport, AuditLog); shared elder-mode type/spacing tokens in the design system; TanStack Query persistence so a volunteer's cash entry survives a dropped signal.

## Explicitly deferred to phase 2
DLT SMS + OTP login, auto-renewal and dunning reminders, Razorpay swap, 2FA, deep analytics dashboards, event photo "Memories", volunteer PWA install prompt.
