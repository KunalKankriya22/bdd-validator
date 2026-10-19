--------------------------------------------------------
--  DDL for Trigger DONATION_TUBES_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONATION_TUBES_BU" BEFORE
    UPDATE ON donation_tubes
    FOR EACH ROW
DECLARE
    audit_rec DONATION_TUBES_ADT%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in DONATION_TUBES_ADT%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;    

        INSERT INTO DONATION_TUBES_ADT VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';

    IF nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') THEN
        audit_rec.column_name := 'transaction_id';
        audit_rec.old_value := :old.transaction_id;
        audit_rec.new_value := :new.transaction_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.unit_id, '*') != nvl(:new.unit_id, '*') THEN
        audit_rec.column_name := 'unit_id';
        audit_rec.old_value := :old.unit_id;
        audit_rec.new_value := :new.unit_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.tube_type, '*') != nvl(:new.tube_type, '*') THEN
        audit_rec.column_name := 'tube_type';
        audit_rec.old_value := :old.tube_type;
        audit_rec.new_value := :new.tube_type;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.insert_date, to_date('01-JAN-33')) != nvl(:new.insert_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'insert_date';
        audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);        
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'insert_user';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);    
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('DONATION_TUBES', 'U', :OLD.audit_key);

    END IF;    
--
END;
/
ALTER TRIGGER "DONATION_TUBES_BU" ENABLE;
