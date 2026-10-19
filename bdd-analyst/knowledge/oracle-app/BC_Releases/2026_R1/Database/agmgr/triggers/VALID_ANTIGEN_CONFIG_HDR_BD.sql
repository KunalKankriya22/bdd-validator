create or replace TRIGGER "AGMGR"."VALID_ANTIGEN_CONFIG_HDR_BD"
before delete
on "AGMGR"."VALID_ANTIGEN_CONFIG_HDR"
for each row
DECLARE
    audit_rec VALID_ANTIGEN_CONFIG_HDR_ADT%rowtype;
    PROCEDURE insert_audit_rec (
        rec_in VALID_ANTIGEN_CONFIG_HDR_ADT%rowtype
    ) IS
    BEGIN

        INSERT INTO VALID_ANTIGEN_CONFIG_HDR_ADT VALUES rec_in;

    END insert_audit_rec;
begin
        audit_rec.audit_key := :old.AUDIT_KEY;
        audit_rec.audit_insert_dats := SYSDATE;
        audit_rec.program_id := 'DELETE';
        audit_rec.user_id := lt_user_session.get_userid;
        audit_rec.action_code := 'D';
        audit_rec.new_value := NULL;

        audit_rec.column_name := 'ANTIGEN_GROUP';
        audit_rec.old_value := :old.ANTIGEN_GROUP;
        insert_audit_rec(audit_rec);
        
        audit_rec.column_name := 'ANTIGEN_CODE';
        audit_rec.old_value := :old.ANTIGEN_CODE;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'LABELING_ANTIGEN_CODE';
        audit_rec.old_value := :old.LABELING_ANTIGEN_CODE;
        insert_audit_rec(audit_rec);        

        audit_rec.column_name := 'NO_OF_UNITS';
        audit_rec.old_value := :old.NO_OF_UNITS;
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

        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.PRIMARY_RULE_ID;
        insert_audit_rec(audit_rec);     

        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.CHAPTER_ID;
        insert_audit_rec(audit_rec);   
end;