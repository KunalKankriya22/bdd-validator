---
tags:
  - trigger
  - AGMGR
---
# VALID_ANTIGEN_CONFIG_DET_BD

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/VALID_ANTIGEN_CONFIG_DET|VALID_ANTIGEN_CONFIG_DET]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec valid_antigen_config_det_adt%rowtype;
    PROCEDURE insert_audit_rec (
        rec_in valid_antigen_config_det_adt%rowtype
    ) IS
    BEGIN

        INSERT INTO valid_antigen_config_det_adt VALUES rec_in;

    END insert_audit_rec;
begin
        audit_rec.audit_key := :old.AUDIT_KEY;
        audit_rec.audit_insert_dats := SYSDATE;
        audit_rec.program_id := 'DELETE';
        audit_rec.user_id := lt_user_session.get_userid;
        audit_rec.action_code := 'D';
        audit_rec.new_value := NULL;

        audit_rec.column_name := 'RULE_ID';
        audit_rec.old_value := :old.RULE_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_TYPE';
        audit_rec.old_value := :old.TEST_TYPE;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_ID';
        audit_rec.old_value := :old.TEST_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'LIC_APPROVE_FLAG';
        audit_rec.old_value := :old.LIC_APPROVE_FLAG;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'NO_OF_TESTS';
        audit_rec.old_value := :old.NO_OF_TESTS;
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

        audit_rec.column_name := 'ANTIGEN_CODE';
        audit_rec.old_value := :old.ANTIGEN_CODE;
        insert_audit_rec(audit_rec);

end;
```
