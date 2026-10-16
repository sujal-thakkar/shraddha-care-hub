-- Track non-member self check-ins separately for consent-aware follow-up.
CREATE TABLE IF NOT EXISTS public.attendance_guest_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_name TEXT NOT NULL,
  attendee_phone TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  experience_feedback TEXT,
  follow_up_status TEXT NOT NULL DEFAULT 'new'
    CHECK (follow_up_status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'self_checkin',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_guest_leads_last_seen
  ON public.attendance_guest_leads(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_guest_leads_status
  ON public.attendance_guest_leads(follow_up_status);

ALTER TABLE public.attendance_guest_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance guest leads"
  ON public.attendance_guest_leads
  FOR ALL TO authenticated
  USING (public.is_any_admin())
  WITH CHECK (public.is_any_admin());

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
GRANT ALL ON public.attendance_guest_leads TO service_role;
