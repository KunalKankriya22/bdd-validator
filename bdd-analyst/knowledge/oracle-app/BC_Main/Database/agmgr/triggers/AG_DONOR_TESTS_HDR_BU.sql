create or replace TRIGGER "AGMGR"."AG_DONOR_TESTS_HDR_BU" BEFORE
    UPDATE ON AG_DONOR_TESTS_HDR
    FOR EACH ROW
DECLARE
    audit_rec AG_DONOR_TESTS_HDR_ADT%rowtype;
    PROCEDURE insert_audit_rec (
        rec_in AG_DONOR_TESTS_HDR_ADT%rowtype
    ) IS
    BEGIN

        INSERT INTO AG_DONOR_TESTS_HDR_ADT VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.AUDIT_KEY;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id := :new.PROGRAM_ID;
    audit_rec.user_id := lt_user_session.get_userid;
    audit_rec.action_code := 'U';

    IF nvl(:old.DONOR_ID, '*') != nvl(:new.DONOR_ID, '*') THEN
        audit_rec.column_name := 'DONOR_ID';
        audit_rec.old_value := :old.DONOR_ID;
        audit_rec.new_value := :new.DONOR_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.ANTIGEN_CODE, '*') != nvl(:new.ANTIGEN_CODE, '*') THEN
        audit_rec.column_name := 'ANTIGEN_CODE';
        audit_rec.old_value := :old.ANTIGEN_CODE;
        audit_rec.new_value := :new.ANTIGEN_CODE;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.RESULT_CODE, '*') != nvl(:new.RESULT_CODE, '*') THEN
        audit_rec.column_name := 'RESULT_CODE';
        audit_rec.old_value := :old.RESULT_CODE;
        audit_rec.new_value := :new.RESULT_CODE;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.CONFIRM_FLAG, '*') != nvl(:new.CONFIRM_FLAG, '*') THEN
        audit_rec.column_name := 'CONFIRM_FLAG';
        audit_rec.old_value := :old.CONFIRM_FLAG;
        audit_rec.new_value := :new.CONFIRM_FLAG;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.CONFIRM_DATE, to_date('01-JAN-33')) != nvl(:new.CONFIRM_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'CONFIRM_DATE';
        audit_rec.old_value := TO_CHAR(:old.CONFIRM_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.CONFIRM_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.RESULT_PENDING, 0) != nvl(:new.RESULT_PENDING, 0) THEN
        audit_rec.column_name := 'RESULT_PENDING';
        audit_rec.old_value := :old.RESULT_PENDING;
        audit_rec.new_value := :new.RESULT_PENDING;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.INSERT_DATE, to_date('01-JAN-33')) != nvl(:new.INSERT_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PRIMARY_RULE_ID, 0) != nvl(:new.PRIMARY_RULE_ID, 0) THEN
        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.PRIMARY_RULE_ID;
        audit_rec.new_value := :new.PRIMARY_RULE_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.INSERT_USER, '*') != nvl(:new.INSERT_USER, '*') THEN
        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.INSERT_USER;
        audit_rec.new_value := :new.INSERT_USER;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PROGRAM_ID, '*') != nvl(:new.PROGRAM_ID, '*') THEN
        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        audit_rec.new_value := :new.PROGRAM_ID;
        insert_audit_rec(audit_rec);
    END IF;


END;