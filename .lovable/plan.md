# Fee Payments tab + advance-credit handling

## 1. New tab: "Fee payments"

A new tab in `/admin/dashboard/members`, sitting beside Members & fees / Renewals, holding the full money trail. Receipt SMS moves out of the bottom of Renewals into this tab, where it belongs.

What the tab shows:

- **Summary strip** — collected today, this month, pending approval, unsettled cash, receipts failed.
- **Payment history list** — every entry from the fee ledger, newest first: member name + membership ID, amount, months covered, period covered, who recorded it, who approved it, source (cash / online), settled or not, and the receipt SMS status for that entry (sent / failed / not sent).
- **Filters** — free-text search (name, membership ID, phone), month range, source, state (pending / approved / rejected), collector, and "receipt failed only".
- **Export** — one click downloads the filtered list as a CSV that opens cleanly in Excel/Google Sheets.
- **Google Sheet mirror** — a "Sync to sheet" button plus automatic append on every approved payment, so a second copy always exists outside the app.

## 2. The active Google Sheet

Every payment that reaches approved state is appended as one row to a "Fee Payments" tab in the Hosla Google Sheet: date, membership ID, name, phone, amount, monthly fee, months covered, period covered, advance credit, source, collected by, approved by, receipt SMS status, entry ID.

The entry ID makes the sheet self-healing: a re-sync updates the matching row instead of duplicating it, and the "Sync to sheet" button can backfill or repair the whole sheet on demand.

Note: the existing Google Sheets connection is read-only today (it powers the Active Members import). Writing rows needs the connection re-authorised with write access — I'll prompt for that during the build; until then the CSV export covers the second copy.

## 3. Advance credit instead of misleading months

Today an amount that does not divide evenly by the monthly fee silently drops the remainder. Instead:

- The remainder is stored on the payment as **advance credit** and carried on the member's profile as a running balance.
- The next payment automatically adds the carried credit before calculating months, so nothing is lost — Rs 700 then Rs 100 on a Rs 400 fee correctly buys two months.
- Wording everywhere is explicit, for example: **"Paid to 30 Sep 2026 · Rs 300 held as advance credit"**. Where there is no remainder, no extra text appears.
- The record-cash sheet on `/admin/dashboard/collect` previews this before saving, so the volunteer sees exactly what the amount buys.
- The receipt SMS keeps the approved DLT template; the "paid up to" value becomes `30 September 2026 (Rs 300 kept as advance credit)` so the member sees the same truth. I'll send one test message to confirm the provider accepts the longer variable, and fall back to the plain date if it rejects it.

## 4. Duplicate / anomaly guard

Before saving a cash entry, the system checks for a same-member payment in the last 10 minutes and asks the collector to confirm it is not a double entry. Repeat entries and unusually large amounts get a small "check this" flag in the payment history so the main admin reviews them at approval time.

## Technical notes

- Migration: add `advance_credit_inr` to `membership_transactions`, `credit_balance_inr` to `profiles`, plus an index on `membership_transactions(created_at)` and `(member_user_id, created_at)` for the history queries. Grants + RLS follow the existing admin-only pattern on those tables.
- `src/lib/membership.ts`: `monthsCovered`/`coveredPeriod` extended to take an incoming credit balance and return `{ months, remainder, label }`; one shared formatter produces the "paid to X · Rs Y advance credit" string used by admin UI, collect page and receipt.
- `record-cash-collection` and `review-transaction` edge functions: apply credit on approval, write `advance_credit_inr`, update the profile balance, add the duplicate check, and call the sheet-append helper.
- New `supabase/functions/_shared/fee-sheet.ts` + a `sync-fee-payments` function for appends and full re-sync through the Sheets connector gateway.
- New `src/pages/admin/FeePayments.tsx` (or a panel component mounted in the new tab) with mobile-first cards, sticky filter bar, and CSV export built client-side. `ReceiptSmsPanel` is moved into this tab.
