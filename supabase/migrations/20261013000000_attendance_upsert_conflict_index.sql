-- PostgREST ON CONFLICT inference cannot target the existing partial index.
-- This non-partial index still permits event-only rows because PostgreSQL treats
-- NULL routine_session_id values as distinct, while supporting routine upserts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_routine_session_upsert
  ON public.attendance_records(session_date, routine_session_id, attendee_phone);