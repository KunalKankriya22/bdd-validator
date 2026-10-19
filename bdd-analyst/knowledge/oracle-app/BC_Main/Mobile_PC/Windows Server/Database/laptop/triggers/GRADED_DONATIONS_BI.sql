-- -----------------------------------------------------------------------------------
-- File Name    : GRADED_DONATIONS_BI.sql
-- Requirements : Capture GRADED DONATIONS records for extract..
-- Date         : 09/19/2023 - MLT-6235 (2024R1)
-- -----------------------------------------------------------------------------------


DROP TRIGGER LAPTOP.GRADED_DONATIONS_BI;

CREATE OR REPLACE TRIGGER LAPTOP."GRADED_DONATIONS_BI" BEFORE
    INSERT ON GRADED_DONATIONS
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
        
        DECLARE
            v_ssn VARCHAR2(9);
        BEGIN
            SELECT
                parameter_value
            INTO v_ssn
            FROM
                valid_parameters
            WHERE
                    parameter_code = 'FKSSN'
                AND sysdate BETWEEN eff_date AND nvl(term_date, sysdate)
                AND ROWNUM = 1;
    
            IF :new.ssn = v_ssn THEN
                :new.ssn := NULL;
            END IF;
    
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;        

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
            'GRADED_DONATIONS',
            v_audit_key,
            'I',
            NULL
        );

    END;

END;
