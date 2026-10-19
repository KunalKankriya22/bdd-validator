--------------------------------------------------------
--  DDL for Trigger INTER_TRANSACTIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "INTER_TRANSACTIONS_BI" before insert
on INTER_TRANSACTIONS
for each row
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
            audit_seq.NEXTVAL
        INTO v_audit_key
        FROM
            dual;

        :new.audit_key := v_audit_key;
    /*---- Added by Edwin -- for laptop data extract- to add in the monitoring table */
        INSERT INTO download_monitor (
            table_name,
            table_audit_key,
            transaction_mode,
            extract_date
        ) VALUES (
            'INTER_TRANSACTIONS',
            v_audit_key,
            'I',
            NULL
        );

    END;
END;
/
ALTER TRIGGER "INTER_TRANSACTIONS_BI" ENABLE;
