# Payment receipt SMS via DLT (Jio TrueConnect) + Fast2SMS

## What the Renewals tab is for

Reference, not part of this build: the Renewals tab lists every member who has a paid-until date, sorted by due date, showing "renews in N days" or "overdue by N days". It has quick selectors ("due within 30 days", "overdue") that feed the reminder composer, and below it the scheduled/recent reminder batches. It is the follow-up and collections view; the directory tab is for lookup and recording payments.

## Scope now

Only **payment receipt SMS**. Sent automatically the moment a payment becomes final:
- cash recorded by a main admin (self-approved),
- cash approved by the main admin in HQ,
- online membership payment confirmed by Stripe.

No SMS on pending entries, rejections, reminders, or settlements yet — those hook into the same helper later.

## Step 1 — What you do on the DLT / Fast2SMS side (before code can send)

1. **Register the content template in Jio TrueConnect** under your approved header `HOSLAS`, category Transactional. This is the body you submitted:

```text
Namaste {#alphanumeric#} , we have received Rs. {#number#}  towards your Hosla membership. Your membership is now paid up to {#alphanumeric#} . Thank you for being a part of the Hosla Extended Family. – Team Hosla 7811009309
```

   Variables in order: member name, amount, paid-up-to date.

2. Wait for approval, then note the **DLT template ID** (19-digit).
3. In **Fast2SMS → DLT Manager**, add the same approved template/sender so Fast2SMS issues its own **Message ID** for it. Fast2SMS's DLT route needs that Message ID, not the DLT one.
4. In Fast2SMS → Dev API, copy the **API key**.
5. Give me these three values and I store them as backend secrets:
   - `FAST2SMS_API_KEY`
   - `FAST2SMS_SENDER_ID` = `HOSLAS`
   - `FAST2SMS_RECEIPT_MESSAGE_ID` = the Fast2SMS Message ID for the receipt template

Nothing else is needed from you; no phone-number whitelisting on the DLT route.

## Step 2 — What I build

**Shared SMS helper** (`supabase/functions/_shared/sms.ts`)
- `sendDltSms({ numbers, messageId, variables })` → POST to Fast2SMS `bulkV2` with `route=dlt`, sender ID, message ID, pipe-joined variable values.
- Normalises phones to bare 10-digit Indian numbers; skips silently with a logged reason if a number is missing/invalid or secrets are unset (never blocks a payment from being recorded).
- `sendPaymentReceiptSms(member, { amount, paidUntil })` builds the three variables in template order.

**Delivery log** (new table `sms_log`)
- Columns: id, member_user_id, membership_id, phone_digits, purpose (`payment_receipt`), variables jsonb, provider_message_id, status (`sent` / `failed` / `skipped`), error, created_at.
- RLS: admins read only; writes via service role. GRANTs for `authenticated` (select) and `service_role`.
- Gives you a visible audit trail and prevents duplicate receipts for the same transaction.

**Wire-in points**
- `record-cash-collection` — after a self-approved cash entry updates `paid_up_until`.
- `review-transaction` (`approve`) — after the ledger row turns `success`.
- `stripe-webhook` — after a membership payment is credited.
All three call the helper with the member's `phone_e164` and the new paid-until date, then insert into `sms_log`.

**Admin visibility**
- Small "SMS receipts" card in the Members & Fees → Renewals tab listing the last 20 sms_log rows (member, purpose, status, time) so you can confirm delivery, plus a red banner if the Fast2SMS secrets are not configured yet.

## Technical notes

- Fast2SMS DLT call shape: `POST https://www.fast2sms.com/dev/bulkV2` with `authorization` header, body `{ route: "dlt", sender_id, message: <messageId>, variables_values: "name|amount|date|", numbers, flash: 0 }`.
- Amount and date are formatted server-side (`en-IN`, e.g. `31 August 2026`) so the SMS matches the ledger exactly.
- Failures are caught and logged, never thrown — a payment must always save even if SMS is down.
- Once this route works, adding due-reminder and settlement SMS is just two more approved templates plus two more message-ID secrets.

## Immediate next action for you

Submit the template text above in Jio TrueConnect. As soon as it is approved and mirrored in Fast2SMS, send me the API key and Message ID and I will finish the wiring.
