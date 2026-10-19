--------------------------------------------------------
--  DDL for Trigger DONATION_ATTRIBUTES_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONATION_ATTRIBUTES_BU" 
before UPDATE
on DONATION_ATTRIBUTES
for each row
BEGIN
    laptop_util.download_monitor_insert('DONATION_ATTRIBUTES', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "DONATION_ATTRIBUTES_BU" ENABLE;
