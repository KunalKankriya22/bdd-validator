--------------------------------------------------------
--  DDL for Trigger MATERIAL_SHIPMENT_TUBES_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "MATERIAL_SHIPMENT_TUBES_BU" BEFORE
    UPDATE ON material_shipment_tubes
    FOR EACH ROW
DECLARE
    audit_rec material_shipment_tubes_adt%rowtype;
    lbAuditInserted BOOLEAN := FALSE; 

    PROCEDURE insert_audit_rec (
        rec_in material_shipment_tubes_adt%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;
        INSERT INTO material_shipment_tubes_adt VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
	--

    IF nvl(:old.SHIPPER_NO, '*') != nvl(:new.SHIPPER_NO, '*') THEN
        audit_rec.column_name := 'SHIPPER_NO';
        audit_rec.old_value := :old.SHIPPER_NO;
        audit_rec.new_value := :new.SHIPPER_NO;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.UNIT_ID, '*') != nvl(:new.UNIT_ID, '*') THEN
        audit_rec.column_name := 'UNIT_ID';
        audit_rec.old_value := :old.UNIT_ID;
        audit_rec.new_value := :new.UNIT_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.TUBE_TYPE, '*') != nvl(:new.TUBE_TYPE, '*') THEN
        audit_rec.column_name := 'TUBE_TYPE';
        audit_rec.old_value := :old.TUBE_TYPE;
        audit_rec.new_value := :new.TUBE_TYPE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.PROGRAM_ID, '*') != nvl(:new.PROGRAM_ID, '*') THEN
        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        audit_rec.new_value := :new.PROGRAM_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('MATERIAL_SHIPMENT_TUBES', 'U', :OLD.audit_key);
    END IF; 
--
END;
/
ALTER TRIGGER "MATERIAL_SHIPMENT_TUBES_BU" ENABLE;
