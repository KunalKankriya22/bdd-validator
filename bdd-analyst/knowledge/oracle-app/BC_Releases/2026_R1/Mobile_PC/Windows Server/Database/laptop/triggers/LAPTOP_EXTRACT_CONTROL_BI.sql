CREATE OR REPLACE TRIGGER "LAPTOP"."LAPTOP_EXTRACT_CONTROL_BI"
    BEFORE INSERT ON laptop_extract_control
    FOR EACH ROW
BEGIN
    DECLARE
        v_audit_key NUMBER := 0;
    BEGIN
        IF :new.insert_user IS NULL THEN
            SELECT
                decode(substr(lt_user_session.get_userid, 1, 3),
                       'OPS',
                       substr(lt_user_session.get_userid, 5),
                       lt_user_session.get_userid)
            INTO :new.insert_user
            FROM
                dual;

        END IF;

        :new.insert_date := sysdate;

        SELECT
            EXTRACT_JOBS_SEQ.NEXTVAL
        INTO v_audit_key
        FROM
            dual;

        :new.job_id := v_audit_key;
    END;
END;