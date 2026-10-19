--------------------------------------------------------
--  DDL for Trigger DONATION_INTERDICTION_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONATION_INTERDICTION_BU" BEFORE
    UPDATE ON donation_interdictions
    FOR EACH ROW
DECLARE
    audit_rec DONATION_INTERDICTIONS_ADT%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in DONATION_INTERDICTIONS_ADT%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;

        INSERT INTO DONATION_INTERDICTIONS_ADT VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';    
--
    IF nvl(:old.ORIGINATED_FROM, '*') != nvl(:new.ORIGINATED_FROM, '*') THEN
        audit_rec.column_name := 'ORIGINATED_FROM';
        audit_rec.old_value := :old.ORIGINATED_FROM;
        audit_rec.new_value := :new.ORIGINATED_FROM;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.TRANSACTION_ID, '*') != nvl(:new.TRANSACTION_ID, '*') THEN
        audit_rec.column_name := 'TRANSACTION_ID';
        audit_rec.old_value := :old.TRANSACTION_ID;
        audit_rec.new_value := :new.TRANSACTION_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.SOURCE_CODE, '*') != nvl(:new.SOURCE_CODE, '*') THEN
        audit_rec.column_name := 'SOURCE_CODE';
        audit_rec.old_value := :old.SOURCE_CODE;
        audit_rec.new_value := :new.SOURCE_CODE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.GROUP_ID, '*') != nvl(:new.GROUP_ID, '*') THEN
        audit_rec.column_name := 'GROUP_ID';
        audit_rec.old_value := :old.GROUP_ID;
        audit_rec.new_value := :new.GROUP_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.UNIT_ID, '*') != nvl(:new.UNIT_ID, '*') THEN
        audit_rec.column_name := 'UNIT_ID';
        audit_rec.old_value := :old.UNIT_ID;
        audit_rec.new_value := :new.UNIT_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.COMMENTS, '*') != nvl(:new.COMMENTS, '*') THEN
        audit_rec.column_name := 'COMMENTS';
        audit_rec.old_value := :old.COMMENTS;
        audit_rec.new_value := :new.COMMENTS;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.PROGRAM_ID, '*') != nvl(:new.PROGRAM_ID, '*') THEN
        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        audit_rec.new_value := :new.PROGRAM_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.CHAPTER_ID, '*') != nvl(:new.CHAPTER_ID, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.CHAPTER_ID;
        audit_rec.new_value := :new.CHAPTER_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.REASON_CODE, '*') != nvl(:new.REASON_CODE, '*') THEN
        audit_rec.column_name := 'REASON_CODE';
        audit_rec.old_value := :old.REASON_CODE;
        audit_rec.new_value := :new.REASON_CODE;
        insert_audit_rec(audit_rec);    
    END IF;
    IF nvl(:old.GROUP_MODE, '*') != nvl(:new.GROUP_MODE, '*') THEN
        audit_rec.column_name := 'GROUP_MODE';
        audit_rec.old_value := :old.GROUP_MODE;
        audit_rec.new_value := :new.GROUP_MODE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.TERM_REASON, '*') != nvl(:new.TERM_REASON, '*') THEN
        audit_rec.column_name := 'TERM_REASON';
        audit_rec.old_value := :old.TERM_REASON;
        audit_rec.new_value := :new.TERM_REASON;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.INTER_TYPE, '*') != nvl(:new.INTER_TYPE, '*') THEN
        audit_rec.column_name := 'INTER_TYPE';
        audit_rec.old_value := :old.INTER_TYPE;
        audit_rec.new_value := :new.INTER_TYPE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.INTER_CODE, '*') != nvl(:new.INTER_CODE, '*') THEN
        audit_rec.column_name := 'INTER_CODE';
        audit_rec.old_value := :old.INTER_CODE;
        audit_rec.new_value := :new.INTER_CODE;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.RELEASE_USER, '*') != nvl(:new.RELEASE_USER, '*') THEN
        audit_rec.column_name := 'RELEASE_USER';
        audit_rec.old_value := :old.RELEASE_USER;
        audit_rec.new_value := :new.RELEASE_USER;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.INSERT_USER, '*') != nvl(:new.INSERT_USER, '*') THEN
        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.INSERT_USER;
        audit_rec.new_value := :new.INSERT_USER;
        insert_audit_rec(audit_rec);    
    END IF;    

    IF nvl(:old.RELEASE_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.RELEASE_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN    
        audit_rec.column_name := 'RELEASE_DATE';
        audit_rec.old_value := TO_CHAR(:old.RELEASE_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.RELEASE_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.COLL_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.COLL_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN    
        audit_rec.column_name := 'RELEASE_DATE';
        audit_rec.old_value := TO_CHAR(:old.COLL_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.COLL_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.INSERT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.INSERT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN    
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.TERM_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.TERM_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN    
        audit_rec.column_name := 'TERM_DATE';
        audit_rec.old_value := TO_CHAR(:old.TERM_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.TERM_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);    
    END IF;

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('DONATION_INTERDICTIONS', 'U', :OLD.audit_key);

        laptop_util.download_monitor_insert('DONATION_INTERDICTIONS_ADT', 'I',:OLD.audit_key);
    END IF;
END;
/
ALTER TRIGGER "DONATION_INTERDICTION_BU" ENABLE;
