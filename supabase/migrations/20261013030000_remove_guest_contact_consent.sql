-- Contact consent is not part of the visitor workflow. Keep visitor history,
-- experience feedback, and follow-up status without storing a consent flag.
ALTER TABLE public.attendance_guest_leads
  DROP COLUMN IF EXISTS contact_consent;

DROP FUNCTION IF EXISTS public.upsert_attendance_guest_lead(TEXT, TEXT, BOOLEAN, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.upsert_attendance_guest_lead(
  p_attendee_name TEXT,
  p_attendee_phone TEXT,
  p_experience_feedback TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'self_checkin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_row public.attendance_guest_leads;
BEGIN
  v_phone := RIGHT(regexp_replace(coalesce(p_attendee_phone, ''), '\D', '', 'g'), 10);
  IF length(v_phone) < 10 OR trim(coalesce(p_attendee_name, '')) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Name and a valid phone number are required.');
  END IF;

  INSERT INTO public.attendance_guest_leads (
    attendee_name, attendee_phone, experience_feedback, source
  ) VALUES (
    trim(p_attendee_name), v_phone, nullif(trim(p_experience_feedback), ''), coalesce(p_source, 'self_checkin')
  )
  ON CONFLICT (attendee_phone) DO UPDATE SET
    attendee_name = EXCLUDED.attendee_name,
    last_seen_at = now(),
    visit_count = public.attendance_guest_leads.visit_count + 1,
    experience_feedback = COALESCE(EXCLUDED.experience_feedback, public.attendance_guest_leads.experience_feedback),
    source = EXCLUDED.source,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN jsonb_build_object('success', true, 'lead_id', v_row.id, 'visit_count', v_row.visit_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_attendance_guest_lead(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;