# Remove Voter ID from membership

Scope for this step only: drop the Voter ID field. The full paid-membership system (checkout, membership numbers, validity, renewals, reminders, member dashboard, analytics, 2FA/authorization) is deferred to a separate planning round using your documents, including how the already-registered members are migrated into it.

## What changes

- Membership form (Hosla Membership Card): the "Voter ID" input, its label and validation are removed. Nothing else in the form changes.
- Admin membership detail view: the "Voter ID" row is removed from the details grid.
- Existing applications keep whatever Voter ID was already stored — nothing is deleted, it just stops being collected or shown.

## Technical notes

- `src/components/corporate/HoslaMembershipModal.tsx`: remove `voterId` from the Zod schema, from `defaultValues`, from the insert payload, and remove the form field block.
- `src/pages/admin/Memberships.tsx`: remove `voter_id` from the row type and the `Detail` row rendering it.
- Migration: make `membership_applications.voter_id` nullable (currently `NOT NULL`) so new inserts succeed without it. The column and its existing data stay.

## Not in this step (next planning round)

Paid checkout at signup, membership numbers, validity periods, receipts, renewal reminders, offline payment marking, member profile dashboard (payment history, timeline, events attended, blogs written), and expanded auth. Migration path for currently registered members will be designed there.
