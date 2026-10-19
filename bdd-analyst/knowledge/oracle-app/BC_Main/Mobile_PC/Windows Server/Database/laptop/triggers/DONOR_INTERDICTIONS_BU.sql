--------------------------------------------------------
--  DDL for Trigger DONOR_INTERDICTIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_INTERDICTIONS_BU" BEFORE
    UPDATE ON donor_interdictions
    FOR EACH ROW
DECLARE
    audit_rec donor_interdictions_audit%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in donor_interdictions_audit%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;

        INSERT INTO donor_interdictions_audit VALUES rec_in;
    END insert_audit_rec;
BEGIN
    :new.last_modified_date := sysdate;

    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';    
--
    IF nvl(:old.donor_id, '*') != nvl(:new.donor_id, '*') THEN
        audit_rec.column_name := 'donor_id';
        audit_rec.old_value := :old.donor_id;
        audit_rec.new_value := :new.donor_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        audit_rec.column_name := 'chapter_id';
        audit_rec.old_value := :old.chapter_id;
        audit_rec.new_value := :new.chapter_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.inter_code, '*') != nvl(:new.inter_code, '*') THEN
        audit_rec.column_name := 'inter_code';
        audit_rec.old_value := :old.inter_code;
        audit_rec.new_value := :new.inter_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.eff_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.eff_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN    
        audit_rec.column_name := 'eff_date';
        audit_rec.old_value := TO_CHAR(:old.eff_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.eff_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.inter_type, '*') != nvl(:new.inter_type, '*') THEN
        audit_rec.column_name := 'inter_type';
        audit_rec.old_value := :old.inter_type;
        audit_rec.new_value := :new.inter_type;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') THEN
        audit_rec.column_name := 'transaction_id';
        audit_rec.old_value := :old.transaction_id;
        audit_rec.new_value := :new.transaction_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.notification_status, '*') != nvl(:new.notification_status, '*') THEN
        audit_rec.column_name := 'notification_status';
        audit_rec.old_value := :old.notification_status;
        audit_rec.new_value := :new.notification_status;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.note_id, '*') != nvl(:new.note_id, '*') THEN
        audit_rec.column_name := 'note_id';
        audit_rec.old_value := :old.note_id;
        audit_rec.new_value := :new.note_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.release_user, '*') != nvl(:new.release_user, '*') THEN
        audit_rec.column_name := 'release_user';
        audit_rec.old_value := :old.release_user;
        audit_rec.new_value := :new.release_user;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.release_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.release_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'release_date';
        audit_rec.old_value := TO_CHAR(:old.term_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.term_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.unit_id, '*') != nvl(:new.unit_id, '*') THEN
        audit_rec.column_name := 'unit_id';
        audit_rec.old_value := :old.unit_id;
        audit_rec.new_value := :new.unit_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.upm_disposition, '*') != nvl(:new.upm_disposition, '*') THEN
        audit_rec.column_name := 'upm_disposition';
        audit_rec.old_value := :old.upm_disposition;
        audit_rec.new_value := :new.upm_disposition;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.originated_from, '*') != nvl(:new.originated_from, '*') THEN
        audit_rec.column_name := 'originated_from';
        audit_rec.old_value := :old.originated_from;
        audit_rec.new_value := :new.originated_from;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.reason_code, '*') != nvl(:new.reason_code, '*') THEN
        audit_rec.column_name := 'reason_code';
        audit_rec.old_value := :old.reason_code;
        audit_rec.new_value := :new.reason_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.group_id, '*') != nvl(:new.group_id, '*') THEN
        audit_rec.column_name := 'group_id';
        audit_rec.old_value := :old.group_id;
        audit_rec.new_value := :new.group_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.letter_seq_no, '*') != nvl(:new.letter_seq_no, '*') THEN
        audit_rec.column_name := 'letter_seq_no';
        audit_rec.old_value := :old.letter_seq_no;
        audit_rec.new_value := :new.letter_seq_no;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.group_mode, '*') != nvl(:new.group_mode, '*') THEN
        audit_rec.column_name := 'group_mode';
        audit_rec.old_value := :old.group_mode;
        audit_rec.new_value := :new.group_mode;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.term_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.term_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'term_date';
        audit_rec.old_value := TO_CHAR(:old.term_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.term_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.term_reason, '*') != nvl(:new.term_reason, '*') THEN
        audit_rec.column_name := 'term_reason';
        audit_rec.old_value := :old.term_reason;
        audit_rec.new_value := :new.term_reason;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'insert_date';
        audit_rec.old_value := TO_CHAR(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'insert_user';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);    
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('DONOR_INTERDICTIONS', 'U', :OLD.audit_key);

        laptop_util.download_monitor_insert('DONOR_INTERDICTIONS_AUDIT', 'I',:OLD.audit_key);
    END IF;
END;
/
ALTER TRIGGER "DONOR_INTERDICTIONS_BU" ENABLE;
