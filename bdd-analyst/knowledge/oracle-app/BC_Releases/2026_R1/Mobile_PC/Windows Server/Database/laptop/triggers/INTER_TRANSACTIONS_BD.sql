--------------------------------------------------------
--  DDL for Trigger INTER_TRANSACTIONS_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "INTER_TRANSACTIONS_BD" BEFORE
    DELETE ON INTER_TRANSACTIONS
    FOR EACH ROW
BEGIN

    DELETE FROM download_monitor
    WHERE table_audit_key = :old.audit_key;

END;
/
ALTER TRIGGER "INTER_TRANSACTIONS_BD" ENABLE;
