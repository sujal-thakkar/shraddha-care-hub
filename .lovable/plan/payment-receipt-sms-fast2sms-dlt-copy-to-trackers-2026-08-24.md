# Payment receipt SMS (Fast2SMS DLT) + copy-to-trackers

## Approved template

Sender `HOSLAS`, Fast2SMS Message ID `223721`, Unicode, Service Explicit / Promo:

```text
Namaste {#alphanumeric#}, we have received Rs. {#number#} towards your Hosla membership. Your membership is now paid up to {#alphanumeric#}. Thank you for being a part of the Hosla Extended Family. – Team Hosla 7811009309
```

Variables in order: member name (alphanumeric), amount (number — digits only, no ₹ or commas), paid-up-to date (alphanumeric, max 30 chars, e.g. `31 August 2026`). Sent with `POST https://www.fast2sms.com/dev/bulkV2`, `authorization` header, JSON body `{ route: "dlt", sender_id: "HOSLAS", message: "223721", variables_values: "name|amount|date", numbers: "…" }`.


## Secrets I will store (never in code)

- `FAST2SMS_API_KEY` — the key you pasted (I will save it to the backend secret store and it stays hidden from the codebase).
- `FAST2SMS_SENDER_ID` = `HOSLAS`
- `FAST2SMS_RECEIPT_MESSAGE_ID` = `223721`

Please rotate the key in Fast2SMS later if you want, since it was pasted in chat.

## When the SMS goes out

The moment a payment becomes final:
- cash recorded by a main admin (self-approved),
- cash approved by the main admin in HQ,
- online membership payment confirmed by Stripe.

Nothing is sent for pending entries, rejections or settlements yet.

## Copy recipients (founder / trackers)

Each receipt is sent to the member **plus** a configurable list of tracker numbers, in the same Fast2SMS call (comma-joined numbers, one API hit, same template).

- Stored in the existing `app_settings` table under key `sms_receipt_copy_numbers` (comma-separated 10-digit numbers) so you can change them any time without a code change.
- Managed from a small "Receipt SMS" card in Members & Fees → Renewals: add/remove numbers, plus an on/off switch for copies.
- Trackers get the same wording (member name, amount, paid-up-to date), which reads as a notification of that member's payment.
- Invalid or duplicate numbers are dropped silently; the member's own number is never duplicated.

## What I build

**Shared helper** `supabase/functions/_shared/sms.ts`
- `sendDltSms({ numbers, messageId, variables })` → `GET https://www.fast2sms.com/dev/bulkV2?authorization=…&route=dlt&sender_id=HOSLAS&message=223721&variables_values=a|b|c&numbers=…`
- Normalises phones to bare 10-digit Indian numbers; skips (with a logged reason) when a number is invalid or secrets are unset — never blocks a payment from saving.
- `sendPaymentReceiptSms(member, { amount, paidUntil })` formats amount and date (`en-IN`, e.g. `31 August 2026`) and appends the tracker numbers.

**Delivery log** — new table `sms_log`: id, member_user_id, membership_id, phone_digits, recipients (jsonb), purpose (`payment_receipt`), variables jsonb, provider_message_id, status (`sent`/`failed`/`skipped`), error, created_at. RLS: admins read; writes by service role only; GRANTs for `authenticated` (select) and `service_role`. Prevents duplicate receipts per transaction.

**Wire-in points**
- `record-cash-collection` — after a self-approved cash entry updates `paid_up_until`.
- `review-transaction` (`approve`) — after the ledger row turns `success`.
- `stripe-webhook` — after a membership payment is credited.

**Admin visibility**
- "Receipt SMS" card in the Renewals tab: tracker-number editor, last 20 `sms_log` rows (member, recipients, status, time), and a warning banner if the Fast2SMS secrets are missing.

## Technical notes

- Fast2SMS DLT route accepts GET or POST; I use POST with the `authorization` header and identical parameters so the key never appears in a URL/log.
- All SMS failures are caught and logged, never thrown.
- Adding due-reminder and settlement SMS later is just another approved template plus one more message-ID secret.
