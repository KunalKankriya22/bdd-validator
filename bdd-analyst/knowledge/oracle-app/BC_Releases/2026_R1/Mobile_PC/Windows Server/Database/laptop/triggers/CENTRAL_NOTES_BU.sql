--------------------------------------------------------
--  DDL for Trigger CENTRAL_NOTES_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "CENTRAL_NOTES_BU" BEFORE
    UPDATE ON central_notes
    FOR EACH ROW
BEGIN
    laptop_util.download_monitor_insert('CENTRAL_NOTES', 'U', :old.audit_key);
END;
/
ALTER TRIGGER "CENTRAL_NOTES_BU" ENABLE;
