--------------------------------------------------------
--  DDL for Trigger PHYSICAL_FINDINGS_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "PHYSICAL_FINDINGS_BD" BEFORE
    DELETE ON physical_findings
    FOR EACH ROW
DECLARE
    audit_rec physical_findings_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in physical_findings_audit%rowtype
    ) IS
    BEGIN
        INSERT INTO physical_findings_audit VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'PHYSICAL_VALUE';
    audit_rec.old_value := :old.PHYSICAL_VALUE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TRANSACTION_ID';
    audit_rec.old_value := :old.TRANSACTION_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'PHYSICAL_VALUE_REPEAT';
    audit_rec.old_value := :old.PHYSICAL_VALUE_REPEAT; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'COMMENTS';
    audit_rec.old_value := :old.COMMENTS; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'PROGRAM_ID';
    audit_rec.old_value := :old.PROGRAM_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CHAPTER_ID';
    audit_rec.old_value := :old.CHAPTER_ID; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'PHYSICAL_CODE';
    audit_rec.old_value := :old.PHYSICAL_CODE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INTER_CODE';
    audit_rec.old_value := :old.INTER_CODE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec);  

    audit_rec.column_name := 'EQUIP_REFERENCE';
    audit_rec.old_value := :old.EQUIP_REFERENCE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'EQUIP_REFERENCE_REPEAT';
    audit_rec.old_value := :old.EQUIP_REFERENCE_REPEAT; 
    insert_audit_rec(audit_rec);   

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'SORT_SEQUENCE';
    audit_rec.old_value := :old.SORT_SEQUENCE; 
    insert_audit_rec(audit_rec);        


    -- 05/24/2021
    begin
        DELETE FROM download_monitor
        WHERE table_audit_key = :old.audit_key;
    end;
    --

    -- laptop_util.download_monitor_insert('PHYSICAL_FINDINGS_AUDIT', 'I',:OLD.audit_key);
END;
/
ALTER TRIGGER "PHYSICAL_FINDINGS_BD" ENABLE;
