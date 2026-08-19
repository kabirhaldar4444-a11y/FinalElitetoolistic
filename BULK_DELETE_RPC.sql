CREATE OR REPLACE FUNCTION public.admin_bulk_delete_records(payload jsonb)
RETURNS json AS $$
DECLARE
    row_data jsonb;
    v_email text;
    v_user_id uuid;
    success_count integer := 0;
    error_count integer := 0;
    errors jsonb := '[]'::jsonb;
BEGIN
    -- 1. Check if caller is admin
    IF public.get_user_role() != 'admin' THEN
        RAISE EXCEPTION 'Not authorized to perform bulk delete';
    END IF;

    -- Loop through the JSON array
    FOR row_data IN SELECT * FROM jsonb_array_elements(payload)
    LOOP
        BEGIN
            v_email := lower(trim(row_data->>'email'));

            IF v_email IS NULL OR v_email = '' THEN
                RAISE EXCEPTION 'Email is required';
            END IF;

            -- Find user by email
            SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

            IF v_user_id IS NOT NULL THEN
                -- Prevent deleting the master admin account
                IF v_email = 'kabirhaldar4444@gmail.com' OR v_email = 'support@elitetoolistic.com' THEN
                    RAISE EXCEPTION 'Cannot delete master admin account';
                END IF;

                -- Call the existing delete function
                PERFORM public.admin_delete_user(v_user_id);
                success_count := success_count + 1;
            ELSE
                error_count := error_count + 1;
                errors := errors || jsonb_build_object('email', v_email, 'error', 'User not found');
            END IF;

        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := errors || jsonb_build_object('email', v_email, 'error', SQLERRM);
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'success_count', success_count,
        'error_count', error_count,
        'errors', errors
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
