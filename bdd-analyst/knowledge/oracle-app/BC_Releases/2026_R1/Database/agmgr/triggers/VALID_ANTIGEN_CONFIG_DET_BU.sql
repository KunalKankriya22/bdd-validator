CREATE OR REPLACE TRIGGER "AGMGR"."VALID_ANTIGEN_CONFIG_DET_BU" BEFORE
    UPDATE ON "AGMGR"."VALID_ANTIGEN_CONFIG_DET"
    FOR EACH ROW
DECLARE
    audit_rec valid_antigen_config_det_adt%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in valid_antigen_config_det_adt%rowtype
    ) IS
    BEGIN
        INSERT INTO valid_antigen_config_det_adt VALUES rec_in;

    END insert_audit_rec;

BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := lt_user_session.get_userid;
    audit_rec.action_code := 'U';
    IF nvl(:old.rule_id, 0) != nvl(:new.rule_id, 0) THEN
        audit_rec.column_name := 'RULE_ID';
        audit_rec.old_value := :old.rule_id;
        audit_rec.new_value := :new.rule_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.test_type, '*') != nvl(:new.test_type, '*') THEN
        audit_rec.column_name := 'TEST_TYPE';
        audit_rec.old_value := :old.test_type;
        audit_rec.new_value := :new.test_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.test_id, '*') != nvl(:new.test_id, '*') THEN
        audit_rec.column_name := 'TEST_ID';
        audit_rec.old_value := :old.test_id;
        audit_rec.new_value := :new.test_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lic_approve_flag, '*') != nvl(:new.lic_approve_flag, '*') THEN
        audit_rec.column_name := 'LIC_APPROVE_FLAG';
        audit_rec.old_value := :old.lic_approve_flag;
        audit_rec.new_value := :new.lic_approve_flag;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.no_of_tests, 0) != nvl(:new.no_of_tests, 0) THEN
        audit_rec.column_name := 'NO_OF_TESTS';
        audit_rec.old_value := :old.no_of_tests;
        audit_rec.new_value := :new.no_of_tests;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.eff_date, TO_DATE('01-JAN-33')) != nvl(:new.eff_date, TO_DATE('01-JAN-33')) THEN
        audit_rec.column_name := 'EFF_DATE';
        audit_rec.old_value := to_char(:old.eff_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.eff_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.term_date, TO_DATE('01-JAN-33')) != nvl(:new.term_date, TO_DATE('01-JAN-33')) THEN
        audit_rec.column_name := 'TERM_DATE';
        audit_rec.old_value := to_char(:old.term_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.term_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-33')) != nvl(:new.insert_date, TO_DATE('01-JAN-33')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.program_id, '*') != nvl(:new.program_id, '*') THEN
        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.program_id;
        audit_rec.new_value := :new.program_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.primary_rule_id, 0) != nvl(:new.primary_rule_id, 0) THEN
        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.primary_rule_id;
        audit_rec.new_value := :new.primary_rule_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.antigen_code, '*') != nvl(:new.antigen_code, '*') THEN
        audit_rec.column_name := 'ANTIGEN_CODE';
        audit_rec.old_value := :old.antigen_code;
        audit_rec.new_value := :new.antigen_code;
        insert_audit_rec(audit_rec);
    END IF;

END;