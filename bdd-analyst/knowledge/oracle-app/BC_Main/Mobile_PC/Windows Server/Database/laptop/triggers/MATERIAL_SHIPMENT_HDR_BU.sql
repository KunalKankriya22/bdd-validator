--------------------------------------------------------
--  DDL for Trigger MATERIAL_SHIPMENT_HDR_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "MATERIAL_SHIPMENT_HDR_BU" BEFORE
    UPDATE ON material_shipment_hdr
    FOR EACH ROW
DECLARE
    audit_rec material_shipment_hdr_adt%rowtype;
    lbAuditInserted BOOLEAN := FALSE;    

    PROCEDURE insert_audit_rec (
        rec_in material_shipment_hdr_adt%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;
        INSERT INTO material_shipment_hdr_adt VALUES rec_in;

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

    IF nvl(:old.DRIVE_ID, '*') != nvl(:new.DRIVE_ID, '*') THEN
        audit_rec.column_name := 'DRIVE_ID';
        audit_rec.old_value := :old.DRIVE_ID;
        audit_rec.new_value := :new.DRIVE_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.SHIP_TYPE, '*') != nvl(:new.SHIP_TYPE, '*') THEN
        audit_rec.column_name := 'SHIP_TYPE';
        audit_rec.old_value := :old.SHIP_TYPE;
        audit_rec.new_value := :new.SHIP_TYPE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.SHIP_FROM_SITE, '*') != nvl(:new.SHIP_FROM_SITE, '*') THEN
        audit_rec.column_name := 'SHIP_FROM_SITE';
        audit_rec.old_value := :old.SHIP_FROM_SITE;
        audit_rec.new_value := :new.SHIP_FROM_SITE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.SHIP_STATUS, '*') != nvl(:new.SHIP_STATUS, '*') THEN
        audit_rec.column_name := 'SHIP_STATUS';
        audit_rec.old_value := :old.SHIP_STATUS;
        audit_rec.new_value := :new.SHIP_STATUS;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.PROGRAM_ID, '*') != nvl(:new.PROGRAM_ID, '*') THEN
        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        audit_rec.new_value := :new.PROGRAM_ID;
        insert_audit_rec(audit_rec);    
    END IF;


    IF nvl(:old.COLL_DATE, to_date('01-JAN-33')) != nvl(:new.COLL_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'COLL_DATE';
        audit_rec.old_value := to_char(:old.COLL_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.COLL_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);   
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('MATERIAL_SHIPMENT_HDR', 'U', :OLD.audit_key);
    END IF;    
--
END;
/
ALTER TRIGGER "MATERIAL_SHIPMENT_HDR_BU" ENABLE;
