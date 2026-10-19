--------------------------------------------------------
--  DDL for Trigger DONOR_COMMUNICATIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_COMMUNICATIONS_BU" BEFORE
    UPDATE ON donor_communications
    FOR EACH ROW
BEGIN
    laptop_util.download_monitor_insert('DONOR_COMMUNICATIONS', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "DONOR_COMMUNICATIONS_BU" ENABLE;
