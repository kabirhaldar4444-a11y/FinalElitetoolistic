CREATE OR REPLACE FUNCTION public.admin_get_user_submissions(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    IF public.get_user_role() NOT IN ('admin', 'staffadmin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'user_id', s.user_id,
            'exam_id', s.exam_id,
            'score', s.score,
            'total_questions', s.total_questions,
            'answers', s.answers,
            'is_released', s.is_released,
            'admin_score_override', s.admin_score_override,
            'created_at', s.created_at,
            'exams', jsonb_build_object('title', e.title)
        )
    )
    INTO result
    FROM public.submissions s
    LEFT JOIN public.exams e ON e.id = s.exam_id
    WHERE s.user_id = p_user_id;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
