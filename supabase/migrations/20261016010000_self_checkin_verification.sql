-- Public link/QR check-ins require admin verification before becoming present.
ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_attendance_status_check;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_attendance_status_check
  CHECK (attendance_status IN ('present', 'pending', 'absent', 'excused', 'unmarked'));

CREATE OR REPLACE FUNCTION public.submit_self_attendance(
    p_routine_session_id UUID DEFAULT NULL,
    p_event_id UUID DEFAULT NULL,
    p_session_date DATE DEFAULT CURRENT_DATE,
    p_session_title TEXT DEFAULT 'Care Hub Session',
    p_event_mode TEXT DEFAULT 'online',
    p_attendee_name TEXT DEFAULT '',
    p_attendee_phone TEXT DEFAULT '',
    p_participation_role TEXT DEFAULT 'listener'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_member RECORD;
    v_record_id UUID;
    v_is_member BOOLEAN := false;
BEGIN
    v_clean_phone := RIGHT(regexp_replace(coalesce(p_attendee_phone, ''), '\D', '', 'g'), 10);
    IF length(v_clean_phone) < 10 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Please provide a valid 10-digit phone number');
    END IF;

    SELECT p.user_id, p.full_name, p.membership_id
    INTO v_member
    FROM public.profiles p
    WHERE p.membership_id IS NOT NULL
      AND RIGHT(regexp_replace(coalesce(p.phone_e164, ''), '\D', '', 'g'), 10) = v_clean_phone
    LIMIT 1;

    IF v_member.user_id IS NOT NULL THEN
        v_is_member := true;
    END IF;

    INSERT INTO public.attendance_records (
        routine_session_id, event_id, session_date, session_title, event_mode,
        member_user_id, membership_id, attendee_name, attendee_phone, is_member,
        attendance_status, participation_role, credits_awarded, checkin_source, checkin_time
    ) VALUES (
        p_routine_session_id, p_event_id, p_session_date, p_session_title, p_event_mode,
        v_member.user_id, v_member.membership_id,
        COALESCE(NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
        v_clean_phone, v_is_member, 'pending', p_participation_role, 0, 'self_checkin', now()
    )
    ON CONFLICT (session_date, routine_session_id, attendee_phone)
    WHERE routine_session_id IS NOT NULL
    DO UPDATE SET
        attendee_name = EXCLUDED.attendee_name,
        member_user_id = EXCLUDED.member_user_id,
        membership_id = EXCLUDED.membership_id,
        is_member = EXCLUDED.is_member,
        attendance_status = 'pending',
        participation_role = EXCLUDED.participation_role,
        credits_awarded = 0,
        updated_at = now()
    RETURNING id INTO v_record_id;

    RETURN jsonb_build_object(
        'success', true,
        'record_id', v_record_id,
        'is_member', v_is_member,
        'membership_id', v_member.membership_id,
        'attendee_name', COALESCE(NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
        'role', p_participation_role,
        'credits_awarded', 0,
        'verification_pending', true,
        'message', 'Check-in submitted for coordinator verification.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_self_attendance(UUID, UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
