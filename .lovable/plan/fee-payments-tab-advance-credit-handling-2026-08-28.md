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

## 3. Advance credit (part payments in both directions)

Today an amount that does not divide evenly by the monthly fee silently drops the remainder. Instead, every payment is recorded at its true value and the leftover is carried as **advance credit** on the member.

How it behaves — member on a Rs 400 monthly fee, paid to 31 Aug:

```text
Day 1  Rs 700 collected  -> 1 month bought (paid to 30 Sep), Rs 300 credit carried
Day 2  Rs 100 collected  -> Rs 100 + Rs 300 credit = Rs 400 -> 1 month
                            (paid to 31 Oct), credit back to Rs 0
```

The reverse case works the same way: a member who gives only Rs 100 against a Rs 400 fee buys no month — the paid-to date does not move, and Rs 100 sits as credit until it tops up to a full month. Nothing is ever rounded away or double counted.

Rules that make it safe:

- **Any amount can be entered.** No "must be a multiple of the fee" restriction, and the collect sheet shows a live preview: what the amount buys, the new paid-to date, and the credit left over — before saving.
- **Cash settlement stays on the money, not the months.** Each collection is its own ledger entry settled at the amount actually handed over (Rs 700 one day, Rs 100 the next). Credit only affects how many months the payment unlocks, never the cash figure a collector must hand in — so the cash reconciliation always equals real rupees collected.
- **Credit is applied at approval, once.** Approval consumes the balance and writes both the credit used and the credit left on that entry, so the ledger shows the full arithmetic and a re-run can never spend the same credit twice. A rejected entry returns the credit untouched.
- **Wording is explicit everywhere**, for example: "Paid to 30 Sep 2026 · Rs 300 held as advance credit", or "Part payment — Rs 100 held as advance credit, paid-to date unchanged". No leftover means no extra text.
- **Credit is visible** as a line on the member card, in the directory, in the payment history, and on the member's own profile page — so an elder can be told exactly what is on their account.
- **Receipt SMS** keeps the approved DLT template; the "paid up to" value becomes `30 September 2026 + Rs 300 credit` (and `unchanged + Rs 100 credit` for a pure part payment). I'll send one test message to confirm the provider accepts the longer variable, and fall back to the plain date if it rejects it.


## 4. Duplicate / anomaly guard

Before saving a cash entry, the system checks for a same-member payment in the last 10 minutes and asks the collector to confirm it is not a double entry. Repeat entries and unusually large amounts get a small "check this" flag in the payment history so the main admin reviews them at approval time.

## Technical notes

- Migration: add `advance_credit_inr` (credit left after this entry) and `credit_used_inr` (credit consumed by it) to `membership_transactions`, `credit_balance_inr` to `profiles`, plus indexes on `membership_transactions(created_at)` and `(member_user_id, created_at)` for the history queries. Grants + RLS follow the existing admin-only pattern on those tables.
- `src/lib/membership.ts`: `monthsCovered`/`coveredPeriod` extended to take the incoming credit balance and return `{ months, creditUsed, creditLeft, newPaidUntil, label }`; one shared formatter produces the "paid to X · Rs Y advance credit" / "part payment" strings used by admin UI, collect page and receipt.
- `record-cash-collection` and `review-transaction` edge functions: apply credit on approval, write `advance_credit_inr`, update the profile balance, add the duplicate check, and call the sheet-append helper.
- New `supabase/functions/_shared/fee-sheet.ts` + a `sync-fee-payments` function for appends and full re-sync through the Sheets connector gateway.
- New `src/pages/admin/FeePayments.tsx` (or a panel component mounted in the new tab) with mobile-first cards, sticky filter bar, and CSV export built client-side. `ReceiptSmsPanel` is moved into this tab.
