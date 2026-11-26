-- ==============================================================================
-- Study Circle Module for Shraddha Care Hub
-- Migration: 20261020000000_study_circle.sql
--
-- Implements the five-table Study Circle model from the design document and
-- wires it into the existing attendance / credit system so that publishing a
-- session automatically marks the listed performers present and awards credits.
--
-- Programs: kathamrita (Tuesday, tentative)  and  pathochokro (Thursday)
-- ==============================================================================

-- ==============================================================================
-- 1. Tables
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.study_circle_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    program_type text NOT NULL CHECK (program_type IN ('kathamrita', 'pathochokro')),
    scheduled_date date NOT NULL,
    start_time time,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),

    title_bn text NOT NULL,
    title_en text,
    note text,
    note_en text,
    meeting_link text,

    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,

    -- Optional explicit link to the weekly routine template used by attendance.
    -- When null the sync resolves it from the program's default weekday.
    routine_session_id uuid REFERENCES public.routine_sessions(id) ON DELETE SET NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT study_circle_sessions_prog_date_uniq UNIQUE (program_type, scheduled_date)
);

CREATE TABLE IF NOT EXISTS public.study_circle_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.study_circle_sessions(id) ON DELETE CASCADE,
    role_name text NOT NULL,
    role_name_en text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_circle_role_performers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id uuid NOT NULL REFERENCES public.study_circle_roles(id) ON DELETE CASCADE,
    member_id uuid REFERENCES public.member_imports(id) ON DELETE SET NULL,
    guest_name text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT study_circle_role_performer_identity_chk
        CHECK (member_id IS NOT NULL OR (guest_name IS NOT NULL AND btrim(guest_name) <> ''))
);

CREATE TABLE IF NOT EXISTS public.study_circle_parts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.study_circle_sessions(id) ON DELETE CASCADE,
    part_number integer,
    item_type text NOT NULL DEFAULT 'other' CHECK (item_type IN ('song', 'reading', 'prayer', 'other')),
    description text NOT NULL DEFAULT '',
    description_en text,
    reference_link text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_circle_part_performers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    part_id uuid NOT NULL REFERENCES public.study_circle_parts(id) ON DELETE CASCADE,
    member_id uuid REFERENCES public.member_imports(id) ON DELETE SET NULL,
    guest_name text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT study_circle_part_performer_identity_chk
        CHECK (member_id IS NOT NULL OR (guest_name IS NOT NULL AND btrim(guest_name) <> ''))
);

-- ==============================================================================
-- 2. Indexes
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_sc_sessions_prog_date ON public.study_circle_sessions(program_type, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_sc_sessions_published ON public.study_circle_sessions(is_published, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_sc_sessions_routine ON public.study_circle_sessions(routine_session_id);

CREATE INDEX IF NOT EXISTS idx_sc_roles_session ON public.study_circle_roles(session_id, display_order);
CREATE INDEX IF NOT EXISTS idx_sc_role_perf_role ON public.study_circle_role_performers(role_id, display_order);
CREATE INDEX IF NOT EXISTS idx_sc_role_perf_member ON public.study_circle_role_performers(member_id);

CREATE INDEX IF NOT EXISTS idx_sc_parts_session ON public.study_circle_parts(session_id, display_order);
CREATE INDEX IF NOT EXISTS idx_sc_part_perf_part ON public.study_circle_part_performers(part_id, display_order);
CREATE INDEX IF NOT EXISTS idx_sc_part_perf_member ON public.study_circle_part_performers(member_id);

-- ==============================================================================
-- 3. Grants
-- ==============================================================================

GRANT SELECT ON public.study_circle_sessions TO anon;
GRANT SELECT ON public.study_circle_roles TO anon;
GRANT SELECT ON public.study_circle_role_performers TO anon;
GRANT SELECT ON public.study_circle_parts TO anon;
GRANT SELECT ON public.study_circle_part_performers TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_role_performers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_parts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_circle_part_performers TO authenticated;

GRANT ALL ON public.study_circle_sessions TO service_role;
GRANT ALL ON public.study_circle_roles TO service_role;
GRANT ALL ON public.study_circle_role_performers TO service_role;
GRANT ALL ON public.study_circle_parts TO service_role;
GRANT ALL ON public.study_circle_part_performers TO service_role;

-- ==============================================================================
-- 4. Row Level Security
-- ==============================================================================

ALTER TABLE public.study_circle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_role_performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_circle_part_performers ENABLE ROW LEVEL SECURITY;

-- Public: only published sessions (and their children) are readable.
CREATE POLICY "Public can view published study circle sessions"
    ON public.study_circle_sessions
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

CREATE POLICY "Public can view roles of published study circle sessions"
    ON public.study_circle_roles
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.study_circle_sessions s
        WHERE s.id = study_circle_roles.session_id AND s.is_published = true
    ));

CREATE POLICY "Public can view role performers of published study circle sessions"
    ON public.study_circle_role_performers
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.study_circle_roles r
        JOIN public.study_circle_sessions s ON s.id = r.session_id
        WHERE r.id = study_circle_role_performers.role_id AND s.is_published = true
    ));

CREATE POLICY "Public can view parts of published study circle sessions"
    ON public.study_circle_parts
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.study_circle_sessions s
        WHERE s.id = study_circle_parts.session_id AND s.is_published = true
    ));

CREATE POLICY "Public can view part performers of published study circle sessions"
    ON public.study_circle_part_performers
    FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.study_circle_parts p
        JOIN public.study_circle_sessions s ON s.id = p.session_id
        WHERE p.id = study_circle_part_performers.part_id AND s.is_published = true
    ));

-- Admins: full access.
CREATE POLICY "Admins manage study circle sessions"
    ON public.study_circle_sessions FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage study circle roles"
    ON public.study_circle_roles FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage study circle role performers"
    ON public.study_circle_role_performers FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage study circle parts"
    ON public.study_circle_parts FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage study circle part performers"
    ON public.study_circle_part_performers FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. updated_at trigger
-- ==============================================================================

DROP TRIGGER IF EXISTS update_study_circle_sessions_updated_at ON public.study_circle_sessions;
CREATE TRIGGER update_study_circle_sessions_updated_at
    BEFORE UPDATE ON public.study_circle_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 6. Helper functions
-- ==============================================================================

-- Map a study-circle role name to the attendance participation_role enum.
CREATE OR REPLACE FUNCTION public.study_circle_role_to_participation(_role_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN _role_name IS NULL THEN 'other'
        WHEN lower(_role_name) LIKE '%singer%' THEN 'singer'
        WHEN lower(_role_name) LIKE '%reader%' THEN 'reader'
        WHEN lower(_role_name) LIKE '%anchor%' OR lower(_role_name) LIKE '%host%' THEN 'anchor'
        WHEN lower(_role_name) LIKE '%director%' OR lower(_role_name) LIKE '%coordinator%' THEN 'director'
        WHEN lower(_role_name) LIKE '%speaker%' OR lower(_role_name) LIKE '%catalyst%' OR lower(_role_name) LIKE '%educator%' THEN 'speaker'
        ELSE 'performer'
    END;
$$;

-- Resolve a member_imports row to a real profile (best effort).
-- Priority: explicit linked_user_id, then 10-digit phone match.
CREATE OR REPLACE FUNCTION public.resolve_study_circle_member(_member_import_id uuid)
RETURNS TABLE (
    user_id uuid,
    full_name text,
    membership_id text,
    phone_digits text,
    mi_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COALESCE(pl.user_id, pp.user_id) AS user_id,
        COALESCE(pl.full_name, pp.full_name) AS full_name,
        COALESCE(pl.membership_id, pp.membership_id) AS membership_id,
        mi.phone_digits,
        mi.name AS mi_name
    FROM public.member_imports mi
    LEFT JOIN public.profiles pl ON pl.user_id = mi.linked_user_id
    LEFT JOIN LATERAL (
        SELECT p.user_id, p.full_name, p.membership_id
        FROM public.profiles p
        WHERE length(RIGHT(regexp_replace(COALESCE(mi.phone_digits, ''), '\D', '', 'g'), 10)) = 10
          AND RIGHT(regexp_replace(COALESCE(mi.phone_digits, ''), '\D', '', 'g'), 10)
            = RIGHT(regexp_replace(COALESCE(p.phone_e164, ''), '\D', '', 'g'), 10)
        LIMIT 1
    ) pp ON true
    WHERE mi.id = _member_import_id;
$$;

-- ==============================================================================
-- 6b. Allow the 'study_circle' check-in source
-- ==============================================================================
-- attendance_records.checkin_source is limited to
-- ('admin_manual','self_checkin','qr_code'). Auto-marked study-circle rows need
-- their own source value, so re-create the constraint to include it.
ALTER TABLE public.attendance_records
    DROP CONSTRAINT IF EXISTS attendance_records_checkin_source_check;
ALTER TABLE public.attendance_records
    ADD CONSTRAINT attendance_records_checkin_source_check
    CHECK (checkin_source IN ('admin_manual', 'self_checkin', 'qr_code', 'study_circle'));

-- ==============================================================================
-- 7. Attendance sync
-- ==============================================================================

-- Rebuild attendance + credit rows for a (published) study-circle session.
-- Idempotent: previously auto-synced rows for the same meeting are replaced.
CREATE OR REPLACE FUNCTION public.sync_study_circle_attendance(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session RECORD;
    v_routine_id uuid;
    v_default_dow int;
    v_mode text;
    v_title text;
    v_matched int := 0;
    v_credited int := 0;
BEGIN
    IF NOT (public.is_admin() OR auth.uid() IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
    END IF;

    SELECT * INTO v_session FROM public.study_circle_sessions WHERE id = p_session_id;
    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Session not found');
    END IF;

    IF v_session.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Session is cancelled; nothing to sync');
    END IF;

    -- Resolve the weekly routine template.
    v_routine_id := v_session.routine_session_id;
    IF v_routine_id IS NULL THEN
        v_default_dow := CASE v_session.program_type WHEN 'kathamrita' THEN 2 ELSE 4 END;
        SELECT id INTO v_routine_id
        FROM public.routine_sessions
        WHERE day_of_week = v_default_dow AND is_active = true
        ORDER BY start_time
        LIMIT 1;
    END IF;

    IF v_routine_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No matching routine session found for this program. Set "routine_session_id" on the session.'
        );
    END IF;

    -- Clear previously auto-synced rows (cascades to their ledger entries).
    DELETE FROM public.attendance_records
    WHERE checkin_source = 'study_circle'
      AND session_date = v_session.scheduled_date
      AND routine_session_id = v_routine_id;

    v_mode  := CASE WHEN NULLIF(btrim(COALESCE(v_session.meeting_link, '')), '') IS NOT NULL
                    THEN 'online' ELSE 'offline' END;
    v_title := COALESCE(NULLIF(btrim(COALESCE(v_session.title_en, '')), ''), v_session.title_bn);

    WITH raw AS (
        SELECT rp.member_id, rp.guest_name, r.role_name
        FROM public.study_circle_roles r
        JOIN public.study_circle_role_performers rp ON rp.role_id = r.id
        WHERE r.session_id = p_session_id
        UNION ALL
        SELECT pp.member_id, pp.guest_name, 'Performer'::text
        FROM public.study_circle_parts pt
        JOIN public.study_circle_part_performers pp ON pp.part_id = pt.id
        WHERE pt.session_id = p_session_id
    ),
    enriched AS (
        SELECT
            public.study_circle_role_to_participation(raw.role_name) AS prole,
            res.user_id AS member_user_id,
            res.membership_id,
            CASE
                WHEN length(regexp_replace(COALESCE(res.phone_digits, ''), '\D', '', 'g')) >= 10
                    THEN RIGHT(regexp_replace(res.phone_digits, '\D', '', 'g'), 10)
                ELSE 'GUEST-' || substr(md5(COALESCE(raw.guest_name, raw.member_id::text, gen_random_uuid()::text)), 1, 10)
            END AS attendee_phone,
            COALESCE(
                NULLIF(btrim(COALESCE(res.full_name, '')), ''),
                NULLIF(btrim(COALESCE(res.mi_name, '')), ''),
                NULLIF(btrim(COALESCE(raw.guest_name, '')), ''),
                'Guest'
            ) AS attendee_name,
            (res.user_id IS NOT NULL) AS is_member,
            raw.role_name
        FROM raw
        LEFT JOIN LATERAL public.resolve_study_circle_member(raw.member_id) res
            ON raw.member_id IS NOT NULL
    ),
    dedup AS (
        SELECT DISTINCT ON (attendee_phone) *
        FROM enriched
        ORDER BY attendee_phone,
            (public.study_circle_role_to_participation(role_name)
                IN ('performer','anchor','director','speaker','singer','reader')) DESC,
            role_name
    )
    INSERT INTO public.attendance_records (
        routine_session_id, session_date, session_title, event_mode,
        member_user_id, membership_id, attendee_name, attendee_phone, is_member,
        attendance_status, participation_role, credits_awarded, checkin_source, checkin_time
    )
    SELECT
        v_routine_id, v_session.scheduled_date, v_title, v_mode,
        dedup.member_user_id, dedup.membership_id, dedup.attendee_name, dedup.attendee_phone, dedup.is_member,
        'present', dedup.prole,
        CASE
            WHEN dedup.is_member AND dedup.prole IN ('performer','anchor','director','speaker','singer','reader') THEN 5
            WHEN dedup.is_member THEN 3
            ELSE 0
        END,
        'study_circle', now()
    FROM dedup
    -- Infer the non-partial unique index (uq_attendance_routine_session_upsert)
    -- the same way the rest of the app upserts attendance.
    ON CONFLICT (session_date, routine_session_id, attendee_phone)
    DO UPDATE SET
        member_user_id     = EXCLUDED.member_user_id,
        membership_id      = EXCLUDED.membership_id,
        attendee_name      = EXCLUDED.attendee_name,
        is_member          = EXCLUDED.is_member,
        attendance_status  = 'present',
        participation_role = EXCLUDED.participation_role,
        credits_awarded    = EXCLUDED.credits_awarded,
        -- Claim ownership so re-publish / unpublish manage this row consistently.
        checkin_source     = 'study_circle',
        updated_at         = now();

    -- Rebuild the credit ledger for the rows this sync owns, so re-syncs never
    -- double-credit and manually-marked attendance for the same meeting is left
    -- untouched.
    DELETE FROM public.member_credit_ledger l
    USING public.attendance_records a
    WHERE l.attendance_record_id = a.id
      AND a.checkin_source = 'study_circle'
      AND a.session_date = v_session.scheduled_date
      AND a.routine_session_id = v_routine_id;

    INSERT INTO public.member_credit_ledger (user_id, attendance_record_id, credits, role, description)
    SELECT a.member_user_id, a.id, a.credits_awarded, a.participation_role,
           'Study Circle: ' || a.session_title || ' as ' || a.participation_role
    FROM public.attendance_records a
    WHERE a.session_date = v_session.scheduled_date
      AND a.routine_session_id = v_routine_id
      AND a.checkin_source = 'study_circle'
      AND a.is_member = true
      AND a.member_user_id IS NOT NULL
      AND a.credits_awarded > 0;

    SELECT count(*) INTO v_matched
    FROM public.attendance_records
    WHERE session_date = v_session.scheduled_date AND routine_session_id = v_routine_id
      AND checkin_source = 'study_circle';

    SELECT count(*) INTO v_credited
    FROM public.attendance_records
    WHERE session_date = v_session.scheduled_date AND routine_session_id = v_routine_id
      AND checkin_source = 'study_circle' AND is_member = true;

    RETURN jsonb_build_object(
        'success', true,
        'routine_session_id', v_routine_id,
        'marked', v_matched,
        'credited', v_credited
    );
END;
$$;

-- Remove auto-synced attendance for a session (e.g. on unpublish).
CREATE OR REPLACE FUNCTION public.unsync_study_circle_attendance(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session RECORD;
    v_routine_id uuid;
    v_default_dow int;
    v_removed int := 0;
BEGIN
    IF NOT (public.is_admin() OR auth.uid() IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
    END IF;

    SELECT * INTO v_session FROM public.study_circle_sessions WHERE id = p_session_id;
    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Session not found');
    END IF;

    v_routine_id := v_session.routine_session_id;
    IF v_routine_id IS NULL THEN
        v_default_dow := CASE v_session.program_type WHEN 'kathamrita' THEN 2 ELSE 4 END;
        SELECT id INTO v_routine_id
        FROM public.routine_sessions
        WHERE day_of_week = v_default_dow AND is_active = true
        ORDER BY start_time
        LIMIT 1;
    END IF;

    IF v_routine_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'removed', 0);
    END IF;

    WITH del AS (
        DELETE FROM public.attendance_records
        WHERE checkin_source = 'study_circle'
          AND session_date = v_session.scheduled_date
          AND routine_session_id = v_routine_id
        RETURNING 1
    )
    SELECT count(*) INTO v_removed FROM del;

    RETURN jsonb_build_object('success', true, 'removed', v_removed);
END;
$$;

-- ==============================================================================
-- 8. Atomic session save (used by the admin editor / debounced auto-save)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.save_study_circle_session(p_session jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
    v_is_published boolean;
    v_program text;
    v_date date;
    v_status text;
    v_conflict uuid;
    v_role jsonb;
    v_role_id uuid;
    v_part jsonb;
    v_part_id uuid;
    v_perf jsonb;
    v_ord_r bigint;
    v_ord_p bigint;
    v_ord bigint;
    v_sync jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authorized');
    END IF;

    v_program      := p_session->>'program_type';
    v_date         := NULLIF(p_session->>'scheduled_date', '')::date;
    v_is_published := COALESCE(NULLIF(p_session->>'is_published', '')::boolean, false);
    v_status       := COALESCE(NULLIF(p_session->>'status', ''), 'scheduled');
    v_id           := NULLIF(p_session->>'id', '')::uuid;

    IF v_program IS NULL OR v_date IS NULL OR COALESCE(btrim(p_session->>'title_bn'), '') = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'program_type, scheduled_date and title_bn are required');
    END IF;

    IF v_program NOT IN ('kathamrita', 'pathochokro') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid program_type');
    END IF;

    IF v_status NOT IN ('scheduled', 'cancelled') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid status');
    END IF;

    SELECT id INTO v_conflict
    FROM public.study_circle_sessions
    WHERE program_type = v_program AND scheduled_date = v_date
    LIMIT 1;

    IF v_conflict IS NOT NULL AND (v_id IS NULL OR v_conflict <> v_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'A session already exists for this program and date',
            'conflict_id', v_conflict
        );
    END IF;

    IF v_id IS NULL THEN
        INSERT INTO public.study_circle_sessions (
            program_type, scheduled_date, start_time, status, title_bn, title_en,
            note, note_en, meeting_link, is_published, published_at, routine_session_id
        ) VALUES (
            v_program, v_date,
            NULLIF(p_session->>'start_time', '')::time,
            v_status,
            p_session->>'title_bn',
            NULLIF(p_session->>'title_en', ''),
            NULLIF(p_session->>'note', ''),
            NULLIF(p_session->>'note_en', ''),
            NULLIF(p_session->>'meeting_link', ''),
            v_is_published,
            CASE WHEN v_is_published THEN now() ELSE NULL END,
            NULLIF(p_session->>'routine_session_id', '')::uuid
        ) RETURNING id INTO v_id;
    ELSE
        UPDATE public.study_circle_sessions SET
            program_type      = v_program,
            scheduled_date    = v_date,
            start_time        = NULLIF(p_session->>'start_time', '')::time,
            status            = v_status,
            title_bn          = p_session->>'title_bn',
            title_en          = NULLIF(p_session->>'title_en', ''),
            note              = NULLIF(p_session->>'note', ''),
            note_en           = NULLIF(p_session->>'note_en', ''),
            meeting_link      = NULLIF(p_session->>'meeting_link', ''),
            is_published      = v_is_published,
            published_at      = CASE
                                    WHEN v_is_published AND published_at IS NULL THEN now()
                                    WHEN NOT v_is_published THEN NULL
                                    ELSE published_at
                                END,
            routine_session_id = NULLIF(p_session->>'routine_session_id', '')::uuid
        WHERE id = v_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'message', 'Session not found');
        END IF;

        -- Replace children (cascades to performers).
        DELETE FROM public.study_circle_roles WHERE session_id = v_id;
        DELETE FROM public.study_circle_parts WHERE session_id = v_id;
    END IF;

    -- Roles + their performers
    FOR v_role, v_ord_r IN
        SELECT value, ordinality
        FROM jsonb_array_elements(COALESCE(p_session->'roles', '[]'::jsonb)) WITH ORDINALITY
    LOOP
        INSERT INTO public.study_circle_roles (session_id, role_name, role_name_en, display_order)
        VALUES (
            v_id,
            COALESCE(NULLIF(btrim(v_role->>'role_name'), ''), 'Role'),
            NULLIF(v_role->>'role_name_en', ''),
            COALESCE(NULLIF(v_role->>'display_order', '')::int, v_ord_r::int)
        ) RETURNING id INTO v_role_id;

        FOR v_perf, v_ord IN
            SELECT value, ordinality
            FROM jsonb_array_elements(COALESCE(v_role->'performers', '[]'::jsonb)) WITH ORDINALITY
        LOOP
            INSERT INTO public.study_circle_role_performers (role_id, member_id, guest_name, display_order)
            VALUES (
                v_role_id,
                NULLIF(v_perf->>'member_id', '')::uuid,
                NULLIF(btrim(v_perf->>'guest_name'), ''),
                COALESCE(NULLIF(v_perf->>'display_order', '')::int, v_ord::int)
            );
        END LOOP;
    END LOOP;

    -- Parts + their performers
    FOR v_part, v_ord_p IN
        SELECT value, ordinality
        FROM jsonb_array_elements(COALESCE(p_session->'parts', '[]'::jsonb)) WITH ORDINALITY
    LOOP
        INSERT INTO public.study_circle_parts (
            session_id, part_number, item_type, description, description_en, reference_link, display_order
        ) VALUES (
            v_id,
            NULLIF(v_part->>'part_number', '')::int,
            COALESCE(NULLIF(v_part->>'item_type', ''), 'other'),
            COALESCE(v_part->>'description', ''),
            NULLIF(v_part->>'description_en', ''),
            NULLIF(v_part->>'reference_link', ''),
            COALESCE(NULLIF(v_part->>'display_order', '')::int, v_ord_p::int)
        ) RETURNING id INTO v_part_id;

        FOR v_perf, v_ord IN
            SELECT value, ordinality
            FROM jsonb_array_elements(COALESCE(v_part->'performers', '[]'::jsonb)) WITH ORDINALITY
        LOOP
            INSERT INTO public.study_circle_part_performers (part_id, member_id, guest_name, display_order)
            VALUES (
                v_part_id,
                NULLIF(v_perf->>'member_id', '')::uuid,
                NULLIF(btrim(v_perf->>'guest_name'), ''),
                COALESCE(NULLIF(v_perf->>'display_order', '')::int, v_ord::int)
            );
        END LOOP;
    END LOOP;

    -- Keep attendance in sync with publication + status state.
    -- A published but cancelled session must NOT mark performers present.
    IF v_is_published AND v_status = 'scheduled' THEN
        v_sync := public.sync_study_circle_attendance(v_id);
    ELSE
        v_sync := public.unsync_study_circle_attendance(v_id);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_id,
        'is_published', v_is_published,
        'sync', v_sync
    );
END;
$$;

-- ==============================================================================
-- 9. Read helpers (bundle / list)
-- ==============================================================================

-- List published sessions for a program (newest first). Public-safe.
CREATE OR REPLACE FUNCTION public.list_published_study_circle_sessions(
    p_program text,
    p_limit int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        jsonb_agg(to_jsonb(t) - 'created_at' ORDER BY t.scheduled_date DESC),
        '[]'::jsonb
    )
    FROM (
        SELECT *
        FROM public.study_circle_sessions
        WHERE program_type = p_program
          AND is_published = true
        ORDER BY scheduled_date DESC
        LIMIT GREATEST(1, LEAST(p_limit, 100))
    ) t;
$$;

-- Full bundle for one session. Public sees published only; admins may see drafts.
CREATE OR REPLACE FUNCTION public.get_study_circle_bundle(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v jsonb;
BEGIN
    SELECT jsonb_build_object(
        'session', to_jsonb(s) - 'created_at',
        'roles', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', r.id,
                'role_name', r.role_name,
                'role_name_en', r.role_name_en,
                'display_order', r.display_order,
                'performers', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', rp.id,
                        'member_id', rp.member_id,
                        'display_name', COALESCE(NULLIF(btrim(mi.name), ''), NULLIF(btrim(rp.guest_name), ''), 'Unknown'),
                        'display_order', rp.display_order
                    ) ORDER BY rp.display_order)
                    FROM public.study_circle_role_performers rp
                    LEFT JOIN public.member_imports mi ON mi.id = rp.member_id
                    WHERE rp.role_id = r.id
                ), '[]'::jsonb)
            ) ORDER BY r.display_order)
            FROM public.study_circle_roles r
            WHERE r.session_id = s.id
        ), '[]'::jsonb),
        'parts', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', pt.id,
                'part_number', pt.part_number,
                'item_type', pt.item_type,
                'description', pt.description,
                'description_en', pt.description_en,
                'reference_link', pt.reference_link,
                'display_order', pt.display_order,
                'performers', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', pp.id,
                        'member_id', pp.member_id,
                        'display_name', COALESCE(NULLIF(btrim(mi.name), ''), NULLIF(btrim(pp.guest_name), ''), 'Unknown'),
                        'display_order', pp.display_order
                    ) ORDER BY pp.display_order)
                    FROM public.study_circle_part_performers pp
                    LEFT JOIN public.member_imports mi ON mi.id = pp.member_id
                    WHERE pp.part_id = pt.id
                ), '[]'::jsonb)
            ) ORDER BY pt.display_order)
            FROM public.study_circle_parts pt
            WHERE pt.session_id = s.id
        ), '[]'::jsonb)
    )
    INTO v
    FROM public.study_circle_sessions s
    WHERE s.id = p_session_id
      AND (s.is_published = true OR public.is_admin());

    RETURN v;
END;
$$;

-- ==============================================================================
-- 10. Function grants
-- ==============================================================================

GRANT EXECUTE ON FUNCTION public.study_circle_role_to_participation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_study_circle_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_study_circle_attendance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsync_study_circle_attendance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_study_circle_session(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_published_study_circle_sessions(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_study_circle_bundle(uuid) TO anon, authenticated;
