-- ==============================================================================
-- Edge-case handling for self check-in when an administrator has already
-- marked the attendee present for the session.
--
-- Scenario: an admin marks a member present from the admin panel, then the
-- attendee opens the public check-in link. Without a guard, submit_self_attendance
-- would upsert the row back to 'pending', pushing the attendee into the admin
-- verification queue a second time (and wiping their credits).
--
-- Two pieces of protection are added:
--   1. check_attendance_already_present() - a read-only lookup the form calls
--      before rendering and before submitting.
--   2. submit_self_attendance() now refuses to downgrade an existing 'present'
--      record and reports already_present = true instead.
--
-- Matching is identical in both functions: a record counts as "already present"
-- when it belongs to the same session/date and matches the attendee either by
-- member_user_id (registered members) or by the last 10 digits of the phone
-- number (guests and members entering their own details).
-- ==============================================================================

-- 1. Read-only pre-submission / pre-render lookup -----------------------------
CREATE OR REPLACE FUNCTION public.check_attendance_already_present(
    p_routine_session_id UUID DEFAULT NULL,
    p_event_id UUID DEFAULT NULL,
    p_session_date DATE DEFAULT CURRENT_DATE,
    p_member_user_id UUID DEFAULT NULL,
    p_attendee_phone TEXT DEFAULT '',
    p_attendee_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_record RECORD;
BEGIN
    v_clean_phone := RIGHT(regexp_replace(coalesce(p_attendee_phone, ''), '\D', '', 'g'), 10);

    SELECT ar.id, ar.attendee_name, ar.membership_id, ar.member_user_id
    INTO v_record
    FROM public.attendance_records ar
    WHERE ar.attendance_status = 'present'
      AND ar.session_date = coalesce(p_session_date, CURRENT_DATE)
      AND (
        (p_routine_session_id IS NOT NULL AND ar.routine_session_id = p_routine_session_id)
        OR (p_routine_session_id IS NULL AND p_event_id IS NOT NULL AND ar.event_id = p_event_id)
      )
      AND (
        (p_member_user_id IS NOT NULL AND ar.member_user_id = p_member_user_id)
        OR (length(v_clean_phone) = 10
            AND RIGHT(regexp_replace(coalesce(ar.attendee_phone, ''), '\D', '', 'g'), 10) = v_clean_phone)
      )
    ORDER BY ar.checkin_time DESC NULLS LAST
    LIMIT 1;

    RETURN jsonb_build_object(
        'already_present', v_record.id IS NOT NULL,
        'record_id', v_record.id,
        'attendee_name', v_record.attendee_name,
        'membership_id', v_record.membership_id,
        'member_user_id', v_record.member_user_id,
        'message', CASE
            WHEN v_record.id IS NOT NULL THEN 'You have already been marked present for this session'
            ELSE NULL
        END
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_attendance_already_present(UUID, UUID, DATE, UUID, TEXT, TEXT) TO anon, authenticated;

-- 2. Hardened self check-in: never downgrade an admin-verified record --------
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
    v_existing RECORD;
BEGIN
    v_clean_phone := RIGHT(regexp_replace(coalesce(p_attendee_phone, ''), '\D', '', 'g'), 10);
    IF length(v_clean_phone) < 10 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Please provide a valid 10-digit phone number');
    END IF;

    -- Resolve the registered member (if any) for this phone number.
    SELECT p.user_id, p.full_name, p.membership_id
    INTO v_member
    FROM public.profiles p
    WHERE p.membership_id IS NOT NULL
      AND RIGHT(regexp_replace(coalesce(p.phone_e164, ''), '\D', '', 'g'), 10) = v_clean_phone
    LIMIT 1;

    IF v_member.user_id IS NOT NULL THEN
        v_is_member := true;
    END IF;

    -- Guard: an administrator may have already marked this attendee present.
    SELECT ar.id, ar.attendee_name, ar.membership_id
    INTO v_existing
    FROM public.attendance_records ar
    WHERE ar.attendance_status = 'present'
      AND ar.session_date = coalesce(p_session_date, CURRENT_DATE)
      AND (
        (p_routine_session_id IS NOT NULL AND ar.routine_session_id = p_routine_session_id)
        OR (p_routine_session_id IS NULL AND p_event_id IS NOT NULL AND ar.event_id = p_event_id)
      )
      AND (
        (v_member.user_id IS NOT NULL AND ar.member_user_id = v_member.user_id)
        OR RIGHT(regexp_replace(coalesce(ar.attendee_phone, ''), '\D', '', 'g'), 10) = v_clean_phone
      )
    ORDER BY ar.checkin_time DESC NULLS LAST
    LIMIT 1;

    IF v_existing.id IS NOT NULL THEN
        -- Leave the admin-verified record untouched; never re-open verification.
        RETURN jsonb_build_object(
            'success', true,
            'already_present', true,
            'record_id', v_existing.id,
            'is_member', v_is_member,
            'membership_id', coalesce(v_existing.membership_id, v_member.membership_id),
            'attendee_name', coalesce(v_existing.attendee_name, NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
            'role', p_participation_role,
            'credits_awarded', 0,
            'verification_pending', false,
            'message', 'You have already been marked present for this session'
        );
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
    WHERE public.attendance_records.attendance_status <> 'present'
    RETURNING id INTO v_record_id;

    -- The upsert was skipped because the conflicting row was already 'present'.
    IF v_record_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_present', true,
            'is_member', v_is_member,
            'membership_id', v_member.membership_id,
            'attendee_name', COALESCE(NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
            'role', p_participation_role,
            'credits_awarded', 0,
            'verification_pending', false,
            'message', 'You have already been marked present for this session'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'already_present', false,
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
