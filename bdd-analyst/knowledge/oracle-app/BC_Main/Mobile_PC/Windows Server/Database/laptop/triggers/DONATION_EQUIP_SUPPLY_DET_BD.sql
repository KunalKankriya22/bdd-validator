--------------------------------------------------------
--  DDL for Trigger DONATION_EQUIP_SUPPLY_DET_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONATION_EQUIP_SUPPLY_DET_BD" BEFORE
    DELETE ON donation_equip_supply_det
    FOR EACH ROW
DECLARE
    audit_rec DONATION_EQUIP_SUPPLY_DET_ADT%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in DONATION_EQUIP_SUPPLY_DET_ADT%rowtype
    ) IS
    BEGIN
        INSERT INTO DONATION_EQUIP_SUPPLY_DET_ADT VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'TRANSACTION_ID';
    audit_rec.old_value := :old.TRANSACTION_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'DRIVE_ID';
    audit_rec.old_value := :old.DRIVE_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'EQUIP_OR_SUPPLY';
    audit_rec.old_value := :old.EQUIP_OR_SUPPLY; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'EQUIP_SUPPLY_CODE';
    audit_rec.old_value := :old.EQUIP_SUPPLY_CODE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CATALOG_NO';
    audit_rec.old_value := :old.CATALOG_NO; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'QC_STATUS';
    audit_rec.old_value := :old.QC_STATUS; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'UNIT_ID';
    audit_rec.old_value := :old.UNIT_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'LOT_NO';
    audit_rec.old_value := :old.LOT_NO; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec);  

    audit_rec.column_name := 'PROGRAM_ID';
    audit_rec.old_value := :old.PROGRAM_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'SUPPLY_ID';
    audit_rec.old_value := :old.SUPPLY_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'SET_ID';
    audit_rec.old_value := :old.SET_ID; 
    insert_audit_rec(audit_rec);        

    audit_rec.column_name := 'EQUIP_REFERENCE';
    audit_rec.old_value := :old.EQUIP_REFERENCE; 
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

    -- laptop_util.download_monitor_insert('DONATION_EQUIP_SUPPLY_DET_ADT', 'I',:OLD.audit_key);
END;
/
ALTER TRIGGER "DONATION_EQUIP_SUPPLY_DET_BD" ENABLE;
