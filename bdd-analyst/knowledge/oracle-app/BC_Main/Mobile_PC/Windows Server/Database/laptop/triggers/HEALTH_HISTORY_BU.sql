--------------------------------------------------------
--  DDL for Trigger HEALTH_HISTORY_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "HEALTH_HISTORY_BU" BEFORE
    UPDATE ON health_history
    FOR EACH ROW
DECLARE
    audit_rec health_history_audit%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in health_history_audit%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;

        INSERT INTO health_history_audit VALUES rec_in;

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

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        audit_rec.column_name := 'chapter_id';
        audit_rec.old_value := :old.chapter_id;
        audit_rec.new_value := :new.chapter_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.question_code, '*') != nvl(:new.question_code, '*') THEN
        audit_rec.column_name := 'question_code';
        audit_rec.old_value := :old.question_code;
        audit_rec.new_value := :new.question_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.answer_code, '*') != nvl(:new.answer_code, '*') THEN
        audit_rec.column_name := 'answer_code';
        audit_rec.old_value := :old.answer_code;
        audit_rec.new_value := :new.answer_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.response, '*') != nvl(:new.response, '*') THEN
        audit_rec.column_name := 'response';
        audit_rec.old_value := :old.response;
        audit_rec.new_value := :new.response;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.template_id, '*') != nvl(:new.template_id, '*') THEN
        audit_rec.column_name := 'template_id';
        audit_rec.old_value := :old.template_id;
        audit_rec.new_value := :new.template_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.inter_code, '*') != nvl(:new.inter_code, '*') THEN
        audit_rec.column_name := 'inter_code';
        audit_rec.old_value := :old.inter_code;
        audit_rec.new_value := :new.inter_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.deferral_period, -1) != nvl(:new.deferral_period, -1) THEN
        audit_rec.column_name := 'deferral_period';
        audit_rec.old_value := :old.deferral_period;
        audit_rec.new_value := :new.deferral_period;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.period_type, '*') != nvl(:new.period_type, '*') THEN
        audit_rec.column_name := 'period_type';
        audit_rec.old_value := :old.period_type;
        audit_rec.new_value := :new.period_type;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.incident_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.incident_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        audit_rec.column_name := 'incident_date';
        audit_rec.old_value := to_char(:old.incident_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.incident_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.comments, '*') != nvl(:new.comments, '*') THEN
        audit_rec.column_name := 'comments';
        audit_rec.old_value := :old.comments;
        audit_rec.new_value := :new.comments;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.def_thru_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.def_thru_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        audit_rec.column_name := 'def_thru_date';
        audit_rec.old_value := to_char(:old.def_thru_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.def_thru_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.insert_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
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
  --

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('HEALTH_HISTORY', 'U', :OLD.audit_key);

        laptop_util.download_monitor_insert('HEALTH_HISTORY_AUDIT', 'I',:OLD.audit_key);
    END IF;  
        --
END;
/
ALTER TRIGGER "HEALTH_HISTORY_BU" ENABLE;
