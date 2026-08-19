CREATE OR REPLACE FUNCTION public.admin_bulk_import_records(payload jsonb)
RETURNS json AS $$
DECLARE
    row_data jsonb;
    v_user_id uuid;
    v_exam_id uuid;
    encrypted_pw text;
    v_name text;
    v_email text;
    v_phone text;
    v_ip text;
    v_subject text;
    v_marks integer;
    v_total integer;
    success_count integer := 0;
    error_count integer := 0;
    errors jsonb := '[]'::jsonb;
BEGIN
    -- 1. Check if caller is admin
    IF public.get_user_role() != 'admin' THEN
        RAISE EXCEPTION 'Not authorized to perform bulk import';
    END IF;

    -- Loop through the JSON array
    FOR row_data IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        BEGIN
            v_name := row_data->>'name';
            v_email := lower(trim(row_data->>'email'));
            v_phone := row_data->>'phone';
            v_ip := trim(row_data->>'ip');
            v_subject := trim(row_data->>'subject');
            v_marks := (row_data->>'marks')::integer;
            v_total := COALESCE((row_data->>'total')::integer, 100);

            IF v_email IS NULL OR v_email = '' THEN
                RAISE EXCEPTION 'Email is required';
            END IF;

            -- Calculate password hash for the specific user (e.g. email before @ + @elite)
            encrypted_pw := crypt(split_part(v_email, '@', 1) || '@elite', gen_salt('bf', 10));

            -- Check if user exists
            SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

            IF v_user_id IS NULL THEN
                -- Create User
                v_user_id := gen_random_uuid();
                
                INSERT INTO auth.users (
                    instance_id, id, aud, role, email, encrypted_password, 
                    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
                    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
                ) VALUES (
                    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email, encrypted_pw,
                    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"candidate"}'::jsonb, 
                    now(), now(), '', '', '', ''
                );

                INSERT INTO auth.identities (
                    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
                ) VALUES (
                    v_user_id, v_user_id, v_user_id::text, format('{"sub":"%s","email":"%s"}', v_user_id::text, v_email)::jsonb, 'email', now(), now(), now()
                );

                INSERT INTO public.profiles (id, email, full_name, phone, role, profile_completed)
                VALUES (v_user_id, v_email, COALESCE(v_name, split_part(v_email, '@', 1)), COALESCE(v_phone, ''), 'candidate', true);
            ELSE
                -- Update profile if name/phone is provided and missing
                UPDATE public.profiles
                SET 
                    full_name = COALESCE(v_name, full_name),
                    phone = COALESCE(v_phone, phone),
                    profile_completed = true
                WHERE id = v_user_id;
            END IF;

            -- Handle IP address by storing it in admissions
            IF v_ip IS NOT NULL AND v_ip != '' THEN
                IF NOT EXISTS (SELECT 1 FROM public.admissions WHERE email = v_email AND course_name = COALESCE(v_subject, 'N/A')) THEN
                    INSERT INTO public.admissions (email, full_name, phone, course_name, ip_address, status)
                    VALUES (v_email, COALESCE(v_name, split_part(v_email, '@', 1)), COALESCE(v_phone, 'N/A'), COALESCE(v_subject, 'N/A'), v_ip, 'approved');
                ELSE
                    UPDATE public.admissions SET ip_address = v_ip WHERE email = v_email AND course_name = COALESCE(v_subject, 'N/A');
                END IF;
            END IF;

            -- Handle Subject/Exam if provided
            IF v_subject IS NOT NULL AND v_subject != '' THEN
                SELECT id INTO v_exam_id FROM public.exams WHERE title ILIKE v_subject LIMIT 1;
                
                IF v_exam_id IS NULL THEN
                    INSERT INTO public.exams (title, duration)
                    VALUES (v_subject, 60)
                    RETURNING id INTO v_exam_id;
                END IF;

                -- Insert marks as a submission if marks provided
                IF v_marks IS NOT NULL THEN
                    -- Check if submission already exists, if so update score, else insert
                    IF EXISTS (SELECT 1 FROM public.submissions WHERE user_id = v_user_id AND exam_id = v_exam_id) THEN
                        UPDATE public.submissions 
                        SET score = v_marks, total_questions = v_total
                        WHERE user_id = v_user_id AND exam_id = v_exam_id;
                    ELSE
                        INSERT INTO public.submissions (user_id, exam_id, score, total_questions, answers, is_released)
                        VALUES (v_user_id, v_exam_id, v_marks, v_total, '{}'::jsonb, true);
                    END IF;
                END IF;
            END IF;

            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := errors || jsonb_build_object('email', v_email, 'error', SQLERRM);
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'processed', success_count + error_count,
        'successful', success_count,
        'failed', error_count,
        'errors', errors
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
