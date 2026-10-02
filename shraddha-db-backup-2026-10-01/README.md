# Shraddha / Hosla database backup

**Created:** 1 October 2026 at 14:55 UTC  
**Format:** PostgreSQL custom archive  
**Source PostgreSQL:** 17.6  
**Backup tool:** pg_dump 18.6

## Verified contents

- Public application schema and data
- Authentication accounts and identities
- Database functions, triggers, indexes, grants, and row-level security policies
- Storage bucket and object metadata

The archive passed a complete `pg_restore` read test with PostgreSQL 17.9.

## Important exclusions

A database archive stores file metadata, but not the actual file bytes from Storage. Keep the earlier `06_storage_files.tar.gz` archive for photos, audio, posters, and evidence files. Server-function source code and secret API-key values are also not stored in a database backup.

## Restore into a new Supabase project

Use a brand-new empty project. Obtain its direct or session-pooler PostgreSQL connection string, then run:

```bash
export NEW_DB_URL='postgresql://...'
pg_restore \
  --dbname="$NEW_DB_URL" \
  --no-owner \
  --no-privileges \
  --verbose \
  shraddhango_2026-10-01.backup
```

Because a new Supabase project already creates managed `auth`, `storage`, and extension objects, restoration may report that some managed objects already exist. Keep the restore log and review any errors before switching the website to the new project.

After restoring:

1. Re-upload the actual Storage files from the earlier storage archive.
2. Deploy the server functions from the earlier migration kit.
3. Re-enter third-party API secrets in the new project; secret values are never included here.
4. Change the website's project URL, publishable key, and project reference.
5. Test member login, admin login, blogs, fee payments, file access, SMS, email, and Stripe before retiring the old database.

## Security

Keep this package private. It contains personal records and password hashes.
