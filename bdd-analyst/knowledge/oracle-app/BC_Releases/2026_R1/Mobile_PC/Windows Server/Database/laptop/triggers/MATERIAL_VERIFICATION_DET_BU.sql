--------------------------------------------------------
--  DDL for Trigger MATERIAL_VERIFICATION_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "MATERIAL_VERIFICATION_DET_BU" BEFORE
    UPDATE ON MATERIAL_VERIFICATION_DET
    FOR EACH ROW
DECLARE
    audit_rec MATERIAL_VERIFICATION_DET_ADT%rowtype;
    lbAuditInserted BOOLEAN := FALSE; 

    PROCEDURE insert_audit_rec (
        rec_in MATERIAL_VERIFICATION_DET_ADT%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;
        INSERT INTO MATERIAL_VERIFICATION_DET_ADT VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
	--

    IF nvl(:old.UNIT_ID, '*') != nvl(:new.UNIT_ID, '*') THEN
        audit_rec.column_name := 'UNIT_ID';
        audit_rec.old_value := :old.UNIT_ID;
        audit_rec.new_value := :new.UNIT_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.VERIFICATION_TYPE, '*') != nvl(:new.VERIFICATION_TYPE, '*') THEN
        audit_rec.column_name := 'VERIFICATION_TYPE';
        audit_rec.old_value := :old.VERIFICATION_TYPE;
        audit_rec.new_value := :new.VERIFICATION_TYPE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.CATALOG_NO, '*') != nvl(:new.CATALOG_NO, '*') THEN
        audit_rec.column_name := 'CATALOG_NO';
        audit_rec.old_value := :old.CATALOG_NO;
        audit_rec.new_value := :new.CATALOG_NO;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.TUBE_TYPE, '*') != nvl(:new.TUBE_TYPE, '*') THEN
        audit_rec.column_name := 'TUBE_TYPE';
        audit_rec.old_value := :old.TUBE_TYPE;
        audit_rec.new_value := :new.TUBE_TYPE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.ADD_ON_FLAG, '*') != nvl(:new.ADD_ON_FLAG, '*') THEN
        audit_rec.column_name := 'ADD_ON_FLAG';
        audit_rec.old_value := :old.ADD_ON_FLAG;
        audit_rec.new_value := :new.ADD_ON_FLAG;
        insert_audit_rec(audit_rec);    
    END IF;    

    IF nvl(:old.PROGRAM_ID, '*') != nvl(:new.PROGRAM_ID, '*') THEN
        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        audit_rec.new_value := :new.PROGRAM_ID;
        insert_audit_rec(audit_rec);    
    END IF;      

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('MATERIAL_VERIFICATION_DET', 'U', :OLD.audit_key);
    END IF; 
--
END;
/
ALTER TRIGGER "MATERIAL_VERIFICATION_DET_BU" ENABLE;
