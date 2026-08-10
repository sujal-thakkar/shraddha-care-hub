# SMS + OTP via Fast2SMS (Jio TrueConnect DLT)

Add real SMS to the site using your DLT-approved templates on sender ID **HOSLAS**, sent through the Fast2SMS DLT API from the backend. Two capabilities:

1. **Phone OTP verification** on membership signup and event registration.
2. **Admin-triggered SMS blasts** using your Blog Notification and Formal Event Invitation templates, to a recipient list the admin picks each time.

Nothing exists today — there is no SMS or OTP code in the project yet, and no Fast2SMS key stored.

## What you need to give me

- **Fast2SMS API key** (Dev API section of the Fast2SMS dashboard) — I'll request it through the secure secret form; it is never put in code.
- **Entity ID / PE ID**: 1201164527599055009 (from your screenshot) and sender/header **HOSLAS**.
- **Message IDs** for each template as they appear in Fast2SMS (Fast2SMS assigns its own numeric `message_id` per DLT template — not the DLT template ID). Needed for:
  - OTP template (plus its exact text so variable order matches)
  - Blog Notification — `Hello! A new blog is now live on the Shraddha website. Read here: {#url#} - Team Hosla`
  - Formal Event Invitation — 3 variables: event name, date, venue

Fast2SMS requires the template to be approved and mapped in their DLT-SMS section before the message_id works.

## 1. OTP verification

**Where it appears**

- **Membership signup** (Hosla membership form): after the form is filled, a "Verify your mobile" step sends a 6-digit code to the contact number; the application is only recorded once verified.
- **Event registration**: after the mobile field, a "Verify" button sends the code; registration (and any payment step) proceeds only after the code is confirmed.

**How it works**

- A backend function generates a random 6-digit code, stores only a hash of it with a 10-minute expiry, and sends it via Fast2SMS using the OTP template.
- A second function checks the code, marks the phone as verified for a short window, and returns a short-lived verification token the form submits alongside the data.
- Limits: max 3 codes per phone per hour, 30-second resend cooldown, max 5 wrong attempts before the code is discarded. All rate limiting is enforced server-side.
- Codes are never returned to the browser and never logged.

Writer/admin login stays on the current PIN system — untouched in this phase.

## 2. Admin SMS blasts

A new **SMS** section in the admin panel:

- Pick a template: **Blog Notification** (choose a published blog; link auto-filled in the DLT-friendly `?blog?slug` form you already set up) or **Event Invitation** (choose an event; name/date/venue auto-filled).
- Pick recipients: from the synced Active Members directory or event registrants, with checkboxes and select-all, plus a manual paste box for extra numbers.
- Preview the exact message and recipient count, then send. Sends run in batches from the backend.
- A send log records template, message text, recipient count, per-number delivery result and cost/failure reason, viewable in admin.
- Only admins can send; the Fast2SMS key lives on the backend only.

## Technical notes

- `phone_otps` table: phone, code hash, purpose, expiry, attempt count, consumed flag. Service-role only — never readable from the browser.
- `sms_logs` table: template key, rendered message, recipients count, status, provider response, sent_by. Admin read-only.
- Edge functions: `send-otp`, `verify-otp`, `send-sms-broadcast`. All validate input with Zod, verify admin role where relevant, and surface Fast2SMS error bodies instead of generic 500s.
- Fast2SMS DLT endpoint: `POST https://www.fast2sms.com/dev/bulkV2` with `route=dlt`, `sender_id=HOSLAS`, `message=<message_id>`, `variables_values` pipe-separated, `numbers` comma-separated. Non-`return:true` responses are logged with the provider's status text.
- Frontend: a reusable `PhoneVerify` component used by both the membership modal and the event registration form; new `src/pages/admin/SMS.tsx` plus a dashboard nav entry.

## Out of scope for now

- OTP for writer login / admin 2FA (planned for the later enterprise auth phase).
- Automatic SMS on new blog publish (manual admin send first, so you control DLT volume/cost).
- Registration confirmation SMS — needs a separate DLT template first.
