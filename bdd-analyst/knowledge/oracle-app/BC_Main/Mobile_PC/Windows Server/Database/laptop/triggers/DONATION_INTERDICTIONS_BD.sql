--------------------------------------------------------
--  DDL for Trigger DONATION_INTERDICTIONS_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONATION_INTERDICTIONS_BD" BEFORE
    DELETE ON donation_interdictions
    FOR EACH ROW
DECLARE
    audit_rec DONATION_INTERDICTIONS_ADT%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in DONATION_INTERDICTIONS_ADT%rowtype
    ) IS
    BEGIN
        INSERT INTO DONATION_INTERDICTIONS_ADT VALUES rec_in;
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

    audit_rec.column_name := 'CHAPTER_ID';
    audit_rec.old_value := :old.CHAPTER_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INTER_CODE';
    audit_rec.old_value := :old.INTER_CODE; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'INTER_TYPE';
    audit_rec.old_value := :old.INTER_TYPE; 
    insert_audit_rec(audit_rec);        

    audit_rec.column_name := 'SOURCE_CODE';
    audit_rec.old_value := :old.SOURCE_CODE; 
    insert_audit_rec(audit_rec);  

    audit_rec.column_name := 'RELEASE_USER';
    audit_rec.old_value := :old.RELEASE_USER; 
    insert_audit_rec(audit_rec);      

    audit_rec.column_name := 'RELEASE_DATE';
    audit_rec.old_value := to_char(:old.RELEASE_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'UNIT_ID';
    audit_rec.old_value := :old.UNIT_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TERM_REASON';
    audit_rec.old_value := :old.TERM_REASON; 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'TERM_DATE';
    audit_rec.old_value := to_char(:old.TERM_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);       

    audit_rec.column_name := 'GROUP_ID';
    audit_rec.old_value := :old.GROUP_ID; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'ORIGINATED_FROM';
    audit_rec.old_value := :old.ORIGINATED_FROM; 
    insert_audit_rec(audit_rec);     

    audit_rec.column_name := 'REASON_CODE';
    audit_rec.old_value := :old.REASON_CODE; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'GROUP_MODE';
    audit_rec.old_value := :old.GROUP_MODE; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'PROGRAM_ID';
    audit_rec.old_value := :old.PROGRAM_ID; 
    insert_audit_rec(audit_rec);  

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'COLL_DATE';
    audit_rec.old_value := to_char(:old.COLL_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'COMMENTS';
    audit_rec.old_value := :old.COMMENTS; 
    insert_audit_rec(audit_rec);    

    -- 05/24/2021
    begin
        DELETE FROM download_monitor
        WHERE table_audit_key = :old.audit_key;
    end;
    --

    -- laptop_util.download_monitor_insert('DONATION_INTERDICTIONS_ADT', 'I',:OLD.audit_key);
END;
/
ALTER TRIGGER "DONATION_INTERDICTIONS_BD" ENABLE;
