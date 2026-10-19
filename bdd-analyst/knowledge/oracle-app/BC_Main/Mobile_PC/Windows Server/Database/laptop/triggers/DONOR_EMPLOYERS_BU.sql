--------------------------------------------------------
--  DDL for Trigger DONOR_EMPLOYERS_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_EMPLOYERS_BU" BEFORE
    UPDATE ON donor_employers
    FOR EACH ROW
BEGIN
    laptop_util.download_monitor_insert('DONOR_EMPLOYERS', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "DONOR_EMPLOYERS_BU" ENABLE;
