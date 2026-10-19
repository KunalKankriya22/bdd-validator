--------------------------------------------------------
--  DDL for Trigger MATERIAL_SHIPMENT_DET_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "MATERIAL_SHIPMENT_DET_BD" BEFORE
    DELETE ON MATERIAL_SHIPMENT_DET
    FOR EACH ROW
DECLARE
    audit_rec material_shipment_det_adt%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in material_shipment_det_adt%rowtype
    ) IS
    BEGIN
        INSERT INTO material_shipment_det_adt VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'UNIT_ID';
    audit_rec.old_value := :old.UNIT_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'SHIP_TYPE';
    audit_rec.old_value := :old.SHIP_TYPE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'PROGRAM_ID';
    audit_rec.old_value := :old.PROGRAM_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'SHIPPER_NO';
    audit_rec.old_value := :old.SHIPPER_NO; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec); 

    -- 05/24/2021
    begin
        DELETE FROM download_monitor
        WHERE table_audit_key = :old.audit_key;
    end;
    --

    -- laptop_util.download_monitor_insert('MATERIAL_SHIPMENT_DET_ADT', 'I',:OLD.audit_key);
END;
/
ALTER TRIGGER "MATERIAL_SHIPMENT_DET_BD" ENABLE;
