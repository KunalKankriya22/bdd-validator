--------------------------------------------------------
--  DDL for Trigger DONATION_EQUIP_SUPPLY_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONATION_EQUIP_SUPPLY_DET_BU" BEFORE
    UPDATE ON donation_equip_supply_det
    FOR EACH ROW
DECLARE
    audit_rec donation_equip_supply_det_adt%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in donation_equip_supply_det_adt%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;

        INSERT INTO donation_equip_supply_det_adt VALUES rec_in;

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

    IF nvl(:old.drive_id, '*') != nvl(:new.drive_id, '*') THEN
        audit_rec.column_name := 'drive_id';
        audit_rec.old_value := :old.drive_id;
        audit_rec.new_value := :new.drive_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_or_supply, '*') != nvl(:new.equip_or_supply, '*') THEN
        audit_rec.column_name := 'equip_or_supply';
        audit_rec.old_value := :old.equip_or_supply;
        audit_rec.new_value := :new.equip_or_supply;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_supply_code, '*') != nvl(:new.equip_supply_code, '*') THEN
        audit_rec.column_name := 'equip_supply_code';
        audit_rec.old_value := :old.equip_supply_code;
        audit_rec.new_value := :new.equip_supply_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.supply_id, '*') != nvl(:new.supply_id, '*') THEN
        audit_rec.column_name := 'supply_id';
        audit_rec.old_value := :old.supply_id;
        audit_rec.new_value := :new.supply_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_reference, '*') != nvl(:new.equip_reference, '*') THEN
        audit_rec.column_name := 'equip_reference';
        audit_rec.old_value := :old.equip_reference;
        audit_rec.new_value := :new.equip_reference;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.catalog_no, '*') != nvl(:new.catalog_no, '*') THEN
        audit_rec.column_name := 'catalog_no';
        audit_rec.old_value := :old.catalog_no;
        audit_rec.new_value := :new.catalog_no;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lot_no, '*') != nvl(:new.lot_no, '*') THEN
        audit_rec.column_name := 'lot_no';
        audit_rec.old_value := :old.lot_no;
        audit_rec.new_value := :new.lot_no;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.qc_status, '*') != nvl(:new.qc_status, '*') THEN
        audit_rec.column_name := 'qc_status';
        audit_rec.old_value := :old.qc_status;
        audit_rec.new_value := :new.qc_status;
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

    IF nvl(:old.unit_id, '*') != nvl(:new.unit_id, '*') THEN
        audit_rec.column_name := 'unit_id';
        audit_rec.old_value := :old.unit_id;
        audit_rec.new_value := :new.unit_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('DONATION_EQUIP_SUPPLY_DET', 'U', :OLD.audit_key);
    END IF;
--
END;
/
ALTER TRIGGER "DONATION_EQUIP_SUPPLY_DET_BU" ENABLE;
