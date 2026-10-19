--------------------------------------------------------
--  DDL for Trigger DOWNLOAD_MONITOR_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DOWNLOAD_MONITOR_BD" before DELETE
 ON DOWNLOAD_MONITOR
 FOR EACH ROW
Declare
     nCount
number := 0;

BEGIN
    SELECT
        nvl(COUNT(*),
            0)
    INTO ncount
    FROM
        download_monitor_archive
    WHERE
            table_audit_key = :old.table_audit_key
        AND table_name = :old.table_name;

    IF ncount = 0 THEN
        INSERT INTO download_monitor_archive (
            table_name,
            table_audit_key,
            transaction_mode,
            extract_date,
            table_insert_date,
            upload_id
        ) VALUES (
            :old.table_name,
            :old.table_audit_key,
            :old.transaction_mode,
            sysdate,
            :old.table_insert_date,
            laptop_tables_extract.get_upload_id
        );

    END IF;

END;
/
ALTER TRIGGER "DOWNLOAD_MONITOR_BD" ENABLE;
