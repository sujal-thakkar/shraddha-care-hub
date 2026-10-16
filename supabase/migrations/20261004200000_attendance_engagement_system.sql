-- ==============================================================================
-- Attendance, Engagement & Participation Tracker for Hosla & Shraddha Care Hub
-- Migration: 20261004200000_attendance_engagement_system.sql
-- ==============================================================================

-- 1. Create Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_session_id UUID REFERENCES public.routine_sessions(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.registration_events(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_title TEXT NOT NULL,
    event_mode TEXT NOT NULL DEFAULT 'online' CHECK (event_mode IN ('online', 'offline')),
    
    -- Member association (nullable for guest / non-members)
    member_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    membership_id TEXT, -- e.g. "HOSLA-1024" or "SHR-1002"
    attendee_name TEXT NOT NULL,
    attendee_phone TEXT NOT NULL,
    is_member BOOLEAN NOT NULL DEFAULT false,
    
    -- Status & Participation Role
    attendance_status TEXT NOT NULL DEFAULT 'present' 
        CHECK (attendance_status IN ('present', 'absent', 'excused', 'unmarked')),
    participation_role TEXT NOT NULL DEFAULT 'listener' 
        CHECK (participation_role IN ('listener', 'performer', 'anchor', 'director', 'speaker', 'singer', 'reader', 'other')),
    credits_awarded INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata & Auditing
    checkin_source TEXT NOT NULL DEFAULT 'admin_manual' 
        CHECK (checkin_source IN ('admin_manual', 'self_checkin', 'qr_code')),
    checkin_time TIMESTAMPTZ DEFAULT now(),
    marked_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraints to prevent duplicate check-ins
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_routine_session 
    ON public.attendance_records(session_date, routine_session_id, attendee_phone) 
    WHERE routine_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_event 
    ON public.attendance_records(session_date, event_id, attendee_phone) 
    WHERE event_id IS NOT NULL;

-- High performance indexing for filters, admin queries, and streak calculations
CREATE INDEX IF NOT EXISTS idx_attendance_date_routine ON public.attendance_records(session_date, routine_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON public.attendance_records(member_user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_phone ON public.attendance_records(attendee_phone);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance_records(attendance_status);

-- 2. Create Member Credit Ledger Table
CREATE TABLE IF NOT EXISTS public.member_credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL CHECK (credits >= 0),
    role TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON public.member_credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_attendance ON public.member_credit_ledger(attendance_record_id);

-- 3. Create Attendance Audit Log Table
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_record_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    altered_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    old_status TEXT,
    new_status TEXT,
    old_role TEXT,
    new_role TEXT,
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.attendance_audit_logs(attendance_record_id);

-- ==============================================================================
-- RLS Security Policies
-- ==============================================================================

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can perform all actions
CREATE POLICY "Admins have full access to attendance_records"
    ON public.attendance_records
    FOR ALL
    TO authenticated
    USING (public.is_any_admin())
    WITH CHECK (public.is_any_admin());

CREATE POLICY "Admins have full access to member_credit_ledger"
    ON public.member_credit_ledger
    FOR ALL
    TO authenticated
    USING (public.is_any_admin())
    WITH CHECK (public.is_any_admin());

CREATE POLICY "Admins have full access to attendance_audit_logs"
    ON public.attendance_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_any_admin())
    WITH CHECK (public.is_any_admin());

-- Members can read their own attendance and credit records
CREATE POLICY "Members can view own attendance_records"
    ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (member_user_id = auth.uid());

CREATE POLICY "Members can view own credit_ledger"
    ON public.member_credit_ledger
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow public / anon to insert attendance records via self check-in
CREATE POLICY "Public can submit self attendance"
    ON public.attendance_records
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow public / anon to read recent self-checkin confirmation
CREATE POLICY "Public can view attendance by phone or id for confirmation"
    ON public.attendance_records
    FOR SELECT
    TO anon, authenticated
    USING (created_at > (now() - INTERVAL '1 day'));

-- ==============================================================================
-- RPC Functions
-- ==============================================================================

-- 1. Privacy-Preserving Member Autocomplete for Public Check-in Form
CREATE OR REPLACE FUNCTION public.lookup_member_for_attendance(_query TEXT)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    membership_id TEXT,
    phone_e164 TEXT,
    phone_masked TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaned_digits TEXT;
    trimmed_q TEXT;
BEGIN
    trimmed_q := trim(coalesce(_query, ''));
    cleaned_digits := regexp_replace(trimmed_q, '\D', '', 'g');
    
    -- Require at least 4 digits for phone search or 3 letters for name / Hosla ID
    IF length(cleaned_digits) < 4 AND length(trimmed_q) < 3 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        p.user_id,
        p.full_name,
        p.membership_id,
        p.phone_e164,
        CONCAT('******', RIGHT(regexp_replace(coalesce(p.phone_e164, ''), '\D', '', 'g'), 4)) AS phone_masked
    FROM public.profiles p
    WHERE 
        p.membership_id IS NOT NULL
        AND (
        (cleaned_digits <> '' AND regexp_replace(coalesce(p.phone_e164, ''), '\D', '', 'g') LIKE '%' || cleaned_digits || '%')
        OR (p.membership_id ILIKE '%' || trimmed_q || '%')
        OR (length(trimmed_q) >= 3 AND p.full_name ILIKE '%' || trimmed_q || '%')
        )
    ORDER BY p.full_name
    LIMIT 6;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_member_for_attendance(TEXT) TO anon, authenticated;

-- 2. Self Check-in Processor with Instant Member Matching & Credit Awarding
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
    v_credits INTEGER;
    v_record_id UUID;
    v_is_member BOOLEAN := false;
    v_streak INTEGER := 1;
    v_total_credits INTEGER := 0;
BEGIN
    -- Normalize phone to last 10 digits
    v_clean_phone := RIGHT(regexp_replace(coalesce(p_attendee_phone, ''), '\D', '', 'g'), 10);
    IF length(v_clean_phone) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Please provide a valid 10-digit phone number'
        );
    END IF;

    -- Calculate credit amount: 5 credits for active roles, 3 for listener
    IF p_participation_role IN ('performer', 'anchor', 'director', 'speaker', 'singer', 'reader') THEN
        v_credits := 5;
    ELSE
        v_credits := 3;
    END IF;

    -- Check if phone matches an existing member profile
    SELECT p.user_id, p.full_name, p.membership_id, p.phone_e164
    INTO v_member
    FROM public.profiles p
        WHERE p.membership_id IS NOT NULL
            AND RIGHT(regexp_replace(coalesce(p.phone_e164, ''), '\D', '', 'g'), 10) = v_clean_phone
    LIMIT 1;

    IF v_member.user_id IS NOT NULL THEN
        v_is_member := true;
    END IF;

    -- Insert or update attendance record
    INSERT INTO public.attendance_records (
        routine_session_id,
        event_id,
        session_date,
        session_title,
        event_mode,
        member_user_id,
        membership_id,
        attendee_name,
        attendee_phone,
        is_member,
        attendance_status,
        participation_role,
        credits_awarded,
        checkin_source,
        checkin_time
    ) VALUES (
        p_routine_session_id,
        p_event_id,
        p_session_date,
        p_session_title,
        p_event_mode,
        v_member.user_id,
        v_member.membership_id,
        COALESCE(NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
        v_clean_phone,
        v_is_member,
        'present',
        p_participation_role,
        v_credits,
        'self_checkin',
        now()
    )
    ON CONFLICT (session_date, routine_session_id, attendee_phone) 
    WHERE routine_session_id IS NOT NULL
    DO UPDATE SET
        participation_role = EXCLUDED.participation_role,
        credits_awarded = EXCLUDED.credits_awarded,
        updated_at = now()
    RETURNING id INTO v_record_id;

    -- If event_id was provided instead of routine_session_id, handle conflict on event_id
    IF v_record_id IS NULL AND p_event_id IS NOT NULL THEN
        INSERT INTO public.attendance_records (
            routine_session_id,
            event_id,
            session_date,
            session_title,
            event_mode,
            member_user_id,
            membership_id,
            attendee_name,
            attendee_phone,
            is_member,
            attendance_status,
            participation_role,
            credits_awarded,
            checkin_source,
            checkin_time
        ) VALUES (
            NULL,
            p_event_id,
            p_session_date,
            p_session_title,
            p_event_mode,
            v_member.user_id,
            v_member.membership_id,
            COALESCE(NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
            v_clean_phone,
            v_is_member,
            'present',
            p_participation_role,
            v_credits,
            'self_checkin',
            now()
        )
        ON CONFLICT (session_date, event_id, attendee_phone)
        WHERE event_id IS NOT NULL
        DO UPDATE SET
            participation_role = EXCLUDED.participation_role,
            credits_awarded = EXCLUDED.credits_awarded,
            updated_at = now()
        RETURNING id INTO v_record_id;
    END IF;

    -- Award credits in member_credit_ledger if registered member
    IF v_is_member AND v_record_id IS NOT NULL THEN
        -- Delete any previous ledger entry for this record to avoid double credit on edit
        DELETE FROM public.member_credit_ledger WHERE attendance_record_id = v_record_id;

        INSERT INTO public.member_credit_ledger (
            user_id,
            attendance_record_id,
            credits,
            role,
            description
        ) VALUES (
            v_member.user_id,
            v_record_id,
            v_credits,
            p_participation_role,
            'Attended ' || p_session_title || ' as ' || p_participation_role
        );

        -- Calculate cumulative credits
        SELECT coalesce(SUM(credits), 0)
        INTO v_total_credits
        FROM public.member_credit_ledger
        WHERE user_id = v_member.user_id;

        -- Calculate current participation streak (consecutive attended dates)
        WITH distinct_dates AS (
            SELECT DISTINCT session_date
            FROM public.attendance_records
            WHERE member_user_id = v_member.user_id AND attendance_status = 'present'
            ORDER BY session_date DESC
        ),
        date_groups AS (
            SELECT 
                session_date,
                session_date - (ROW_NUMBER() OVER (ORDER BY session_date DESC))::integer AS grp
            FROM distinct_dates
        )
        SELECT COUNT(*)::integer
        INTO v_streak
        FROM date_groups
        WHERE grp = (SELECT grp FROM date_groups ORDER BY session_date DESC LIMIT 1);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'record_id', v_record_id,
        'is_member', v_is_member,
        'membership_id', v_member.membership_id,
        'attendee_name', COALESCE(NULLIF(trim(p_attendee_name), ''), v_member.full_name, 'Guest Attendee'),
        'role', p_participation_role,
        'credits_awarded', v_credits,
        'total_credits', v_total_credits,
        'current_streak', COALESCE(v_streak, 1),
        'message', 'Attendance recorded successfully!'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_self_attendance TO anon, authenticated;

-- 3. Member Engagement Summary RPC (For Profile & Gamification)
CREATE OR REPLACE FUNCTION public.get_member_attendance_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_sessions INTEGER := 0;
    v_total_credits INTEGER := 0;
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_roles_count JSONB;
    v_recent_history JSONB;
BEGIN
    -- Total present sessions
    SELECT COUNT(*)
    INTO v_total_sessions
    FROM public.attendance_records
    WHERE member_user_id = p_user_id AND attendance_status = 'present';

    -- Total credits earned
    SELECT coalesce(SUM(credits), 0)
    INTO v_total_credits
    FROM public.member_credit_ledger
    WHERE user_id = p_user_id;

    -- Roles count breakdown
    SELECT coalesce(jsonb_object_agg(role, cnt), '{}'::jsonb)
    INTO v_roles_count
    FROM (
        SELECT participation_role AS role, COUNT(*) AS cnt
        FROM public.attendance_records
        WHERE member_user_id = p_user_id AND attendance_status = 'present'
        GROUP BY participation_role
    ) r;

    -- Recent history (last 20 attendances)
    SELECT coalesce(jsonb_agg(h), '[]'::jsonb)
    INTO v_recent_history
    FROM (
        SELECT id, session_title, session_date, event_mode, participation_role, credits_awarded, checkin_time
        FROM public.attendance_records
        WHERE member_user_id = p_user_id
        ORDER BY session_date DESC, checkin_time DESC
        LIMIT 20
    ) h;

    -- Streak calculation
    WITH distinct_dates AS (
        SELECT DISTINCT session_date
        FROM public.attendance_records
        WHERE member_user_id = p_user_id AND attendance_status = 'present'
        ORDER BY session_date DESC
    ),
    date_groups AS (
        SELECT 
            session_date,
            session_date - (ROW_NUMBER() OVER (ORDER BY session_date DESC))::integer AS grp
        FROM distinct_dates
    )
    SELECT coalesce(COUNT(*)::integer, 0)
    INTO v_current_streak
    FROM date_groups
    WHERE grp = (SELECT grp FROM date_groups ORDER BY session_date DESC LIMIT 1);

    RETURN jsonb_build_object(
        'total_sessions', v_total_sessions,
        'total_credits', v_total_credits,
        'current_streak', v_current_streak,
        'roles_breakdown', v_roles_count,
        'recent_history', v_recent_history
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_attendance_summary(UUID) TO anon, authenticated;
