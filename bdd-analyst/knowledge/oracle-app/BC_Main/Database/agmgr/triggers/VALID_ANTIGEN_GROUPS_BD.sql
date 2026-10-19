CREATE OR REPLACE TRIGGER "AGMGR"."VALID_ANTIGEN_GROUPS_BD" BEFORE
    DELETE ON "AGMGR"."VALID_ANTIGEN_GROUPS"
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
        audit_rec.program_id := 'DELETE';
        audit_rec.user_id := lt_user_session.get_userid;
        audit_rec.action_code := 'D';
        audit_rec.new_value := NULL;

        audit_rec.column_name := 'ANTIGEN_GROUP';
        audit_rec.old_value := :old.ANTIGEN_GROUP;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'SER_AG_TEST_ID';
        audit_rec.old_value := :old.SER_AG_TEST_ID;
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'MOL_AG_TEST_ID';
        audit_rec.old_value := :old.MOL_AG_TEST_ID;
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'EFF_DATE';
        audit_rec.old_value := TO_CHAR(:old.EFF_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TERM_DATE';
        audit_rec.old_value := TO_CHAR(:old.TERM_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.INSERT_USER;
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'SER_TEST_DISP_ORDER';
        audit_rec.old_value := :old.SER_TEST_DISP_ORDER;
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'MOL_TEST_DISP_ORDER';
        audit_rec.old_value := :old.MOL_TEST_DISP_ORDER;
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'ANTIGEN_GRP_DISP_ORDER';
        audit_rec.old_value := :old.ANTIGEN_GRP_DISP_ORDER;
        insert_audit_rec(audit_rec);        
END;