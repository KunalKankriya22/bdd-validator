CREATE OR REPLACE TRIGGER "AGMGR"."VALID_ANTIGEN_GROUPS_BU" BEFORE
    UPDATE ON "AGMGR"."VALID_ANTIGEN_GROUPS"
    FOR EACH ROW
DECLARE
    audit_rec valid_antigen_groups_adt%rowtype;
    PROCEDURE insert_audit_rec (
        rec_in valid_antigen_groups_adt%rowtype
    ) IS
    BEGIN

        INSERT INTO valid_antigen_groups_adt VALUES rec_in;

    END insert_audit_rec;    
BEGIN
    audit_rec.audit_key := :old.AUDIT_KEY;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id := :new.PROGRAM_ID;
    audit_rec.user_id := lt_user_session.get_userid;
    audit_rec.action_code := 'U';

    IF nvl(:old.ANTIGEN_GROUP, '*') != nvl(:new.ANTIGEN_GROUP, '*') THEN
        audit_rec.column_name := 'ANTIGEN_GROUP';
        audit_rec.old_value := :old.ANTIGEN_GROUP;
        audit_rec.new_value := :new.ANTIGEN_GROUP;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.SER_AG_TEST_ID, '*') != nvl(:new.SER_AG_TEST_ID, '*') THEN
        audit_rec.column_name := 'SER_AG_TEST_ID';
        audit_rec.old_value := :old.SER_AG_TEST_ID;
        audit_rec.new_value := :new.SER_AG_TEST_ID;
        insert_audit_rec(audit_rec);
    END IF;    

    IF nvl(:old.MOL_AG_TEST_ID, '*') != nvl(:new.MOL_AG_TEST_ID, '*') THEN
        audit_rec.column_name := 'MOL_AG_TEST_ID';
        audit_rec.old_value := :old.MOL_AG_TEST_ID;
        audit_rec.new_value := :new.MOL_AG_TEST_ID;
        insert_audit_rec(audit_rec);
    END IF;   
    
    IF nvl(:old.EFF_DATE, to_date('01-JAN-33')) != nvl(:new.EFF_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'EFF_DATE';
        audit_rec.old_value := TO_CHAR(:old.EFF_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.EFF_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;    

    IF nvl(:old.TERM_DATE, to_date('01-JAN-33')) != nvl(:new.TERM_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'TERM_DATE';
        audit_rec.old_value := TO_CHAR(:old.TERM_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.TERM_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;    
    
    IF nvl(:old.INSERT_DATE, to_date('01-JAN-33')) != nvl(:new.INSERT_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
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

    IF nvl(:old.SER_TEST_DISP_ORDER, 0) != nvl(:new.SER_TEST_DISP_ORDER, 0) THEN
        audit_rec.column_name := 'SER_TEST_DISP_ORDER';
        audit_rec.old_value := :old.SER_TEST_DISP_ORDER;
        audit_rec.new_value := :new.SER_TEST_DISP_ORDER;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.MOL_TEST_DISP_ORDER, 0) != nvl(:new.MOL_TEST_DISP_ORDER, 0) THEN
        audit_rec.column_name := 'MOL_TEST_DISP_ORDER';
        audit_rec.old_value := :old.MOL_TEST_DISP_ORDER;
        audit_rec.new_value := :new.MOL_TEST_DISP_ORDER;
        insert_audit_rec(audit_rec);
    END IF;
    
    IF nvl(:old.ANTIGEN_GRP_DISP_ORDER, 0) != nvl(:new.ANTIGEN_GRP_DISP_ORDER, 0) THEN
        audit_rec.column_name := 'ANTIGEN_GRP_DISP_ORDER';
        audit_rec.old_value := :old.ANTIGEN_GRP_DISP_ORDER;
        audit_rec.new_value := :new.ANTIGEN_GRP_DISP_ORDER;
        insert_audit_rec(audit_rec);
    END IF;    

END;