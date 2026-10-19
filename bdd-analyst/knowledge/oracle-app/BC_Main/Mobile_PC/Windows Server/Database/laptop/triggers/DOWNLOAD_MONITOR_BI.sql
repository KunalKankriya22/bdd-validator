--------------------------------------------------------
--  DDL for Trigger DOWNLOAD_MONITOR_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DOWNLOAD_MONITOR_BI" 
    BEFORE INSERT ON download_monitor
    FOR EACH ROW
BEGIN

    :new.table_insert_date := sysdate;

END;
/
ALTER TRIGGER "DOWNLOAD_MONITOR_BI" ENABLE;
