--------------------------------------------------------
--  DDL for Trigger INTER_TRANSACTIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "INTER_TRANSACTIONS_BU" BEFORE
    UPDATE ON INTER_TRANSACTIONS
    FOR EACH ROW
DECLARE

BEGIN
    laptop_util.download_monitor_insert('INTER_TRANSACTIONS', 'U', :OLD.audit_key);
END;
/
ALTER TRIGGER "INTER_TRANSACTIONS_BU" ENABLE;
