--------------------------------------------------------
--  DDL for Trigger DONOR_PICTURES_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_PICTURES_BU" BEFORE
    UPDATE ON donor_pictures
    FOR EACH ROW
BEGIN
    laptop_util.download_monitor_insert('DONOR_PICTURES', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "DONOR_PICTURES_BU" ENABLE;
