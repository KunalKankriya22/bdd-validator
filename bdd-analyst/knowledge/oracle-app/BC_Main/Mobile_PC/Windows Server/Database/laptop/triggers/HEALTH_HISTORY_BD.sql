--------------------------------------------------------
--  DDL for Trigger HEALTH_HISTORY_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "HEALTH_HISTORY_BD" BEFORE
    DELETE ON health_history
    FOR EACH ROW
DECLARE
    audit_rec health_history_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in health_history_audit%rowtype
    ) IS
    BEGIN
        INSERT INTO health_history_audit VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'RESPONSE';
    audit_rec.old_value := :old.RESPONSE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TRANSACTION_ID';
    audit_rec.old_value := :old.TRANSACTION_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'QUESTION_CODE';
    audit_rec.old_value := :old.QUESTION_CODE; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'TEMPLATE_ID';
    audit_rec.old_value := :old.TEMPLATE_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'DONOR_RESP_LANG';
    audit_rec.old_value := :old.DONOR_RESP_LANG; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'COMMENTS';
    audit_rec.old_value := :old.COMMENTS; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'GROUP_CODE';
    audit_rec.old_value := :old.GROUP_CODE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'PROGRAM_ID';
    audit_rec.old_value := :old.PROGRAM_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CHAPTER_ID';
    audit_rec.old_value := :old.CHAPTER_ID; 
    insert_audit_rec(audit_rec);  

    audit_rec.column_name := 'ANSWER_CODE';
    audit_rec.old_value := :old.ANSWER_CODE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INTER_CODE';
    audit_rec.old_value := :old.INTER_CODE; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec);        

    audit_rec.column_name := 'PERIOD_TYPE';
    audit_rec.old_value := :old.PERIOD_TYPE; 
    insert_audit_rec(audit_rec);        

    audit_rec.column_name := 'INCIDENT_DATE';
    audit_rec.old_value := to_char(:old.INCIDENT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'START_DATE';
    audit_rec.old_value := to_char(:old.START_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'DEF_THRU_DATE';
    audit_rec.old_value := to_char(:old.DEF_THRU_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'END_DATE';
    audit_rec.old_value := to_char(:old.END_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);     

    audit_rec.column_name := 'DEFERRAL_PERIOD';
    audit_rec.old_value := :old.DEFERRAL_PERIOD; 
    insert_audit_rec(audit_rec);        


    -- 05/24/2021
    begin
        DELETE FROM download_monitor
        WHERE table_audit_key = :old.audit_key;
    end;
    --

    -- laptop_util.download_monitor_insert('HEALTH_HISTORY_AUDIT', 'I',:OLD.audit_key);
END;
/
ALTER TRIGGER "HEALTH_HISTORY_BD" ENABLE;
