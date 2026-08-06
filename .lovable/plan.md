# Professional payments: membership, member verification, receipts, webhooks

## How member vs non-member works today (and what's wrong)

On a paid event form, after you submit, the app calls a database check that looks for **any approved Hosla membership application** matching either:

- the same email address (case-insensitive), or
- a phone number whose digits appear anywhere inside the application's "child contact" number.

If it finds one, the person is marked as a member and skips payment.

Problems with that: the loose "digits appear anywhere" match can wrongly match another family's number; it uses the *child/family contact* rather than the member's own number; and "approved" does not mean "paid" or "still valid" — so an unpaid or lapsed application still gets free entry.

## What we'll build

### 1. Membership becomes a real, paid membership

- Membership form leads straight to Stripe checkout after submission (pay now at signup), as a **one-time charge for the chosen period** (monthly or yearly, non-metro/metro pricing already on the page).
- Premium/Personalised plans have no fixed public price, so those stay enquiry-first: the application is recorded and our team follows up with a payment link.
- After a successful payment the membership is marked **active**, gets a **membership number** (e.g. `HSL-2026-0148`), a validity period (1 month or 12 months), and a confirmation email with the number and the Stripe receipt link.
- Admin membership panel shows plan, amount, payment status, membership number, validity, and can mark offline/cash payments as paid or extend validity.
- Remove the **Voter ID** field from the membership form (kept out of admin detail view too).

### 2. Member verification at paid events (Membership ID + phone)

On a paid event, before payment we show a short "Already a Hosla member?" step:

- Member enters **membership number + their mobile number**.
- We verify server-side that the membership is active, paid, and not expired, and that the phone matches (exact 10-digit normalised match).
- Verified → free registration, marked as member with the membership number stored on the registration.
- Not verified → clear message plus the existing pay / become-a-member options. No silent guessing based on email.

### 3. Downloadable Stripe receipts

- Each successful event payment stores Stripe's hosted **receipt URL**.
- Confirmation screen shows a "Download receipt" button; the confirmation email includes the same link; admin Registrations rows get a receipt link and the CSV gets a receipt column.
- Same for membership payments.

### 4. Stripe webhooks (server-side confirmation)

- New webhook endpoint that verifies Stripe's signature and handles `checkout.session.completed`, `checkout.session.async_payment_succeeded/failed`, and `charge.refunded`.
- It marks event registrations paid (with receipt URL) and activates memberships, **even if the user closes the browser** on the redirect.
- Both webhook and the existing on-return verification are idempotent, so a payment is only ever recorded once and confirmation emails send once.
- You'll need to add the endpoint URL in your Stripe dashboard and save the signing secret; I'll give you the exact URL and ask for the secret at that point.

### 5. Donations page

No payment gateway is or will be wired into donations — it stays manual UPI QR / bank transfer as today. I'll remove the leftover "Credit/Debit card payments will be available soon" line so the page doesn't promise a gateway.

## Technical notes

- Migration: `membership_applications` gains `membership_no` (unique), `payment_status`, `amount_inr`, `billing_cycle`, `city_type`, `stripe_session_id`, `receipt_url`, `paid_at`, `valid_from`, `valid_until`, `is_active`; drop the NOT NULL requirement on `voter_id`. `event_registrations` gains `receipt_url` and `membership_no`.
- Replace `is_hosla_member` with a `verify_hosla_member(_membership_no, _phone)` security-definer function returning validity + member name; only active, paid, unexpired rows qualify. Keep grants aligned (public forms need `anon` execute on the verify function only).
- New edge functions: `create-membership-checkout`, `stripe-webhook` (signature-verified via `STRIPE_WEBHOOK_SECRET`, raw body). `verify-event-payment` extended to persist `receipt_url` from the payment intent's latest charge and to remain idempotent alongside the webhook.
- Frontend: `HoslaMembershipModal` (remove Voter ID, add checkout redirect + success/return handling), `MembershipPlans` (plan/price passed into checkout), `PaidEventPrompt` (membership-ID verification step + receipt/download state), `EventRegistration` (verification call, receipt button, webhook-tolerant polling), `admin/Memberships` and `admin/Registrations` (payment columns, receipt links, mark-as-paid).
