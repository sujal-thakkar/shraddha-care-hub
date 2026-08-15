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

## 4. RBAC: member / volunteer / main admin
| Action | Volunteer | Main admin |
| --- | --- | --- |
| Record cash collection | Yes (pending approval) | Yes (self-approved) |
| Approve direct-UPI reports | View only | Yes |
| Settle volunteer cash | View own balance | Yes |
| Change fees, delete payments | No | Yes (audit-logged) |
| Manage users | Create only | Full |

Roles live in the existing `user_roles` table (never on the profile), extended with `volunteer` and `main_admin`.

## 5. Admin panel additions
- **Members**: searchable list with plan, fee, paid-until, status, membership ID; detail view with full payment timeline, blogs written, events attended.
- **Credentials**: create a member account (ID auto-generated), set or reset the password, copy it to share, and force a password change on next sign-in.
- **Verification queue**: direct-UPI reports with the screenshot when one was attached; approve or reject with reason.
- **Cash & settlement**: pending cash entries to approve, and per-volunteer outstanding balances with a "Settle" action.
- **Import review**: merged list from the Active Members sheet and approved applications; admin sets fee amount and paid-until date, then activates.
- **Audit log**: read-only trail of every money action.

## 6. Member profile as a "living room" (not a dashboard)
Rebuilt `/profile` for elders: big "Namaste {name}" header with photo and a green/orange membership badge, then Membership (vertical month timeline showing "Paid via Amit on 12 Aug", pay/report buttons), My Stories, and My Events with the next event's pass. Minimum 18px text, 56px tap targets, static bold labels above inputs, works in English and Bengali.

## Technical notes
- Migration adds: `members` fields on profiles (membership_no, plan, monthly_fee_amount, paid_up_until, chapter, member_status), `transactions`, `fee_audit_log`, `otp_codes`, `sms_log`, `member_imports`; new `volunteer` and `main_admin` values on `app_role`; RLS so members read only their own transactions and insert only direct-UPI reports, volunteers insert cash entries, main admins manage all — with GRANTs on every new table.
- New edge functions: `send-otp`, `verify-otp` (verifies then mints a Supabase session via an admin-generated one-time link), `stripe-webhook`, `create-membership-checkout`, `record-cash-collection`, `send-sms-broadcast`, `import-members`.
- Fast2SMS needs a secret; I'll request `FAST2SMS_API_KEY`. Stripe webhook needs `STRIPE_WEBHOOK_SECRET`.
- Frontend: OTP flow added to `src/pages/Auth.tsx` (PIN path preserved), `src/pages/Profile.tsx` rebuilt, new admin pages under `src/pages/admin/` (Members, Verifications, CashSettlement, MemberImport, SMS, AuditLog), shared elder-mode type/spacing tokens in the design system, TanStack Query persistence so a volunteer's cash entry survives a dropped signal.

## Explicitly deferred to phase 2
Auto-renewal and dunning reminders, Razorpay swap, 2FA, deep analytics dashboards, event photo "Memories", volunteer PWA install prompt.
