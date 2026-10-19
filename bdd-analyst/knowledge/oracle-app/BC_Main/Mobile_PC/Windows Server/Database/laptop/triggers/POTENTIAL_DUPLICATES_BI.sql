-- -----------------------------------------------------------------------------------
-- File Name    : POTENTIAL_DUPLICATES_BI.sql
-- Requirements : Capture POTENTIAL_DUPLICATES records for extract..
-- Date         : 09/19/2023 - MLT-6235 (2024R1)
-- -----------------------------------------------------------------------------------

DROP TRIGGER LAPTOP.POTENTIAL_DUPLICATES_BI;

CREATE OR REPLACE TRIGGER LAPTOP."POTENTIAL_DUPLICATES_BI" BEFORE
    INSERT ON POTENTIAL_DUPLICATES
    FOR EACH ROW
BEGIN
    DECLARE
        v_audit_key NUMBER := 0;
    BEGIN
        IF :new.program_id IS NULL THEN
            :new.program_id := 'MANUAL';
        END IF;

        IF :new.insert_user IS NULL THEN
            SELECT
                lt_user_session.get_userid
            INTO :new.insert_user
            FROM
                dual;

        END IF;

        IF :new.insert_date IS NULL THEN
            :new.insert_date := sysdate;
        END IF;

        SELECT
            audit_seq.NEXTVAL
        INTO v_audit_key
        FROM
            dual;

        :new.audit_key := v_audit_key;

  /*---- Added by Seshu-- for laptop data extract- to add in the monitoring table */
        INSERT INTO download_monitor (
            table_name,
            table_audit_key,
            transaction_mode,
            extract_date
        ) VALUES (
            'POTENTIAL_DUPLICATES',
            v_audit_key,
            'I',
            NULL
        );

    END;

END;
