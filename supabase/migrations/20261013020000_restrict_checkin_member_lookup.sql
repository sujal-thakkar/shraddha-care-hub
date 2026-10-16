-- Keep the public check-in member search in sync with the admin member roster.
-- Profiles without a membership_id are not registered members and must remain guests.
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

    IF length(cleaned_digits) < 4 AND length(trimmed_q) < 3 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        p.user_id,
        p.full_name,
        p.membership_id,
        p.phone_e164,
        CONCAT('******', RIGHT(regexp_replace(coalesce(p.phone_e164, ''), '\D', '', 'g'), 4))
    FROM public.profiles p
    WHERE p.membership_id IS NOT NULL
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