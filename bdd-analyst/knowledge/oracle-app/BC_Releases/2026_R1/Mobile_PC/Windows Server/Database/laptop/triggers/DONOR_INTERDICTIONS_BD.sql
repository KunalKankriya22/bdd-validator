--------------------------------------------------------
--  DDL for Trigger DONOR_INTERDICTIONS_BD
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_INTERDICTIONS_BD" BEFORE
    DELETE ON donor_interdictions
    FOR EACH ROW
DECLARE
    audit_rec donor_interdictions_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in donor_interdictions_audit%rowtype
    ) IS
    BEGIN
        INSERT INTO donor_interdictions_audit VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'donor_id';
    audit_rec.old_value := :old.donor_id; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'chapter_id';
    audit_rec.old_value := :old.chapter_id; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'inter_code';
    audit_rec.old_value := :old.inter_code; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'eff_date';
    audit_rec.old_value := to_char(:old.eff_date, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'inter_type';
    audit_rec.old_value := :old.inter_type; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'transaction_id';
    audit_rec.old_value := :old.transaction_id; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'notification_status';
    audit_rec.old_value := :old.notification_status; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'note_id';
    audit_rec.old_value := :old.note_id; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'release_user';
    audit_rec.old_value := :old.release_user; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'release_date';
    audit_rec.old_value := to_char(:old.release_date, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'unit_id';
    audit_rec.old_value := :old.unit_id; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'upm_disposition';
    audit_rec.old_value := :old.upm_disposition; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'last_modified_date';
    audit_rec.old_value := to_char(:old.last_modified_date, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'originated_from';
    audit_rec.old_value := :old.originated_from; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'reason_code';
    audit_rec.old_value := :old.reason_code; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'group_id';
    audit_rec.old_value := :old.group_id; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'letter_seq_no';
    audit_rec.old_value := :old.letter_seq_no; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'group_mode';
    audit_rec.old_value := :old.group_mode; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'term_date';
    audit_rec.old_value := to_char(:old.term_date, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'term_reason';
    audit_rec.old_value := :old.term_reason; 
    insert_audit_rec(audit_rec); 

    audit_rec.column_name := 'insert_date';
    audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);      

    audit_rec.column_name := 'insert_user';
    audit_rec.old_value := :old.insert_user; 
    insert_audit_rec(audit_rec); 

    -- 05/24/2021
    begin
        DELETE FROM download_monitor
        WHERE table_audit_key = :old.audit_key;
    end;
    --

    -- laptop_util.download_monitor_insert('DONOR_INTERDICTIONS_AUDIT', 'I',:OLD.audit_key);
END;
/
ALTER TRIGGER "DONOR_INTERDICTIONS_BD" ENABLE;
