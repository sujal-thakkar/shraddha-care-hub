# Hosla Membership Platform — Phase 1 (OTP login, member ledger, cash & UPI workflows, RBAC)

Building the enterprise membership foundation from your design docs, plus the DLT SMS/OTP layer, in one coherent phase. Renewals, dunning, analytics and 2FA stay for the next phase.

## Decisions locked from your answers
- One account per phone for everyone (member, writer, volunteer, admin). Login becomes **phone + OTP first**, with the existing 4-digit PIN kept as an alternative so current writers are not locked out.
- Fee engine is a **monthly ledger** (fee amount per member + "paid up until" date). The Standard/Premium plan prices only set the default monthly amount.
- Stripe stays as the online gateway for now; the design is webhook-first so Razorpay can drop in later.
- Existing members are imported from **both** the Active Members sheet and approved membership applications into an admin review screen where each record is confirmed before activation.

## 1. Login with SMS OTP (Jio TrueConnect DLT via Fast2SMS)
- Sign-in screen: country code + 10-digit phone, big "Send code" button, then a 6-digit code box. "Use my PIN instead" link stays available.
- Codes are generated and hashed server-side, expire in 5 minutes, are single-use, limited to 5 sends per phone per hour, and locked after 5 wrong attempts.
- Sent through your approved DLT OTP template with sender ID HOSLAS.
- New numbers can sign up with OTP only; no PIN required (they can add one later in profile).

## 2. Member records and the fee ledger
Each member gets: membership number (HSL-2026-0148 style), plan, monthly fee amount, paid-up-until date, city chapter, join date, status (active / renewal due / lapsed) with a 15-day grace buffer.

A single transactions ledger records every rupee with its source and state:
- `stripe` → success immediately (confirmed by webhook, not the redirect page).
- `direct_upi` → pending_verification (member/child reported it).
- `cash` → pending_approval (volunteer collected it), then settled.
- Plus rejected, with the reason.

Approving a transaction is what extends the paid-up-until date. Months covered are computed from amount ÷ monthly fee, so ₹600 on a ₹300 plan reads "April–May" before anyone confirms. Every state change is written to an audit log with who did it and when. Duplicate submissions for the same member and month are blocked.

## 3. The three payment workflows
**A. Online (Stripe)** — member pays from their profile; a `stripe-webhook` function marks the transaction paid and extends validity even if the browser is closed. A downloadable receipt link is stored.

**B. "I paid directly on PhonePe/GPay" (member or their child)** — screenshot-first form: amount, date, paid by self/someone else, mandatory screenshot upload, optional transaction ID. Creates pending_verification and shows a clear "Waiting for admin approval" badge. Uploads go to a new private bucket.

**C. Cash collected by a volunteer** — the *receiver* records it, never the elder. Volunteer searches the member by name or phone (fuzzy search), sees "Rina is on the ₹300 plan; ₹600 covers April–May", confirms, and the member immediately gets an SMS receipt. The amount lands in that volunteer's floating-cash balance until a main admin settles it.

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
- **Members**: searchable list with plan, fee, paid-until, status, membership number; detail view with full payment timeline, blogs written, events attended.
- **Verification queue**: direct-UPI reports side by side with the uploaded screenshot; approve or reject with reason.
- **Cash & settlement**: pending cash entries to approve, and per-volunteer outstanding balances with a "Settle" action.
- **Import review**: merged list from the Active Members sheet and approved applications; admin sets fee amount and paid-until date, then activates.
- **SMS broadcasts**: send your approved event-invitation and blog-notification templates to Active Members or an event's registrants, with a preview and confirm step.
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
