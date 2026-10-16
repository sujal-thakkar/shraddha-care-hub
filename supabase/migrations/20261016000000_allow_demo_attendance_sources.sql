-- Allow clearly tagged test data so the admin reset can remove it safely.
ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_checkin_source_check;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_checkin_source_check
  CHECK (checkin_source IN ('admin_manual', 'self_checkin', 'qr_code', 'demo', 'test'));
