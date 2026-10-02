# Shraddha / Hosla — full backup & migration kit

Taken: 5 Sep 2026. Everything your site needs is in this folder. Nothing here depends on Lovable.

## What's inside

| File | What it is |
|---|---|
| `01_public_schema.sql` | Every table, view, function, trigger, index, security rule and access grant (40 tables, 108 security policies) |
| `02_public_data.sql` | All the actual data — blogs, members, donations, registrations, fee payments, comments, notifications (~1.5 MB) |
| `03_auth_users.csv` | 82 login accounts (members + admins), including their password hashes |
| `03_auth_identities.csv` | The matching sign-in identity records |
| `04_storage_metadata.sql` | The file records for all 490 stored files |
| `05_storage_files.csv` | Readable list of every stored file (bucket, name, size, type) |
| `06_storage_files.tar.gz` | The actual 490 files — posters, team photos, avatars, blog audio, evidence (296 MB) |
| `code/functions/` | All 37 server functions (SMS receipts, Stripe, fee collection, emails, etc.) |
| `code/migrations/` | The 68 historical database migrations |
| `code/config.toml` | Server function configuration |
| `restore.sh` | One script that rebuilds structure + data + accounts on a new Supabase project |
| `upload_storage.py` | Uploads all the files back into a new Supabase project's storage |
| `post_restore.sql` | The one piece pg_dump can't include: the new-signup trigger |

## Restore onto your own free Supabase project

1. Create a project at supabase.com. From Project Settings → Database, copy the **connection string** (session pooler or direct).
2. Rebuild database + accounts:
   ```bash
   export DB_URL='postgresql://postgres:YOURPASSWORD@...'
   ./restore.sh
   ```
   Ignore the one expected error `schema "public" already exists`.
3. Recreate the storage buckets in the Supabase dashboard with exactly these names and visibility:
   - `project-posters` — public
   - `team-photos` — public
   - `avatars` — private
   - `blog-audio` — private
   - `membership-photos` — private
   - `payment-proofs` — private
   - `abuse-evidence` — private
4. Upload the files:
   ```bash
   tar -xzf 06_storage_files.tar.gz -C ./storage-files
   export SUPABASE_URL='https://YOURPROJECT.supabase.co'
   export SUPABASE_SERVICE_ROLE_KEY='...'   # Project Settings → API
   python3 upload_storage.py ./storage-files
   ```
5. Deploy the server functions (needs the Supabase CLI, `npm i -g supabase`):
   ```bash
   cd code && supabase link --project-ref YOURREF && supabase functions deploy
   ```
6. Add the function secrets in Supabase → Edge Functions → Secrets. You already hold these values:
   `FAST2SMS_API_KEY`, `FAST2SMS_ENTITY_ID`, `FAST2SMS_RECEIPT_MESSAGE_ID`, `FAST2SMS_SENDER_ID`,
   `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, `MURF_API_KEY`,
   `MAIN_ADMIN_CONSOLE_PASSPHRASE`, `GOOGLE_SHEETS_API_KEY`, `GOOGLE_SEARCH_CONSOLE_API_KEY`.
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` are provided automatically by Supabase.)
   `LOVABLE_API_KEY` is the only one that won't carry over. It is used for just one thing: the Google Sheets sync
   (active-members import and the fee-payments mirror sheet). Everything else — SMS receipts, Stripe payments, emails,
   AI writing check (Gemini), read-aloud (Murf) — uses your own keys and keeps working untouched.
   To bring the Sheets sync back, create a free Google Cloud service account, enable the Google Sheets API, share the
   sheet with the service account e-mail, and swap the two calls in `code/functions/_shared/fee-sheet.ts` and
   `code/functions/sync-active-members/index.ts` to call `sheets.googleapis.com` directly with that account.
   Until then, only the Sheets mirror stops; the ledger inside the site is unaffected.
7. In your website code (GitHub → Vercel), change three environment variables to the new project:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
   Redeploy on Vercel — done.

## Things worth knowing

- **Passwords keep working.** Member and admin passwords are hashed with bcrypt and copied as-is, so everyone signs in exactly as before.
- **Stripe** needs its webhook URL repointed to the new project's `stripe-webhook` function URL.
- **Free-tier sleep:** Supabase free projects pause after 7 days of no activity; one click in the dashboard wakes them, unlimited and free.
- Keep this folder private — it contains members' phone numbers, addresses and password hashes.
