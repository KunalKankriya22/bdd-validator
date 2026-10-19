---
tags:
  - trigger
  - AGMGR
---
# AG_DONOR_TESTS_DET_BD

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/AG_DONOR_TESTS_DET|AG_DONOR_TESTS_DET]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec AG_DONOR_TESTS_DET_ADT%rowtype;
    PROCEDURE insert_audit_rec (
        rec_in AG_DONOR_TESTS_DET_ADT%rowtype
    ) IS
    BEGIN

        INSERT INTO AG_DONOR_TESTS_DET_ADT VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.AUDIT_KEY;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id := 'DELETE';
    audit_rec.user_id := lt_user_session.get_userid;
    audit_rec.action_code := 'D';
    audit_rec.new_value := NULL;

        audit_rec.column_name := 'DONOR_ID';
        audit_rec.old_value := :old.DONOR_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'ANTIGEN_CODE';
        audit_rec.old_value := :old.ANTIGEN_CODE;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_ID';
        audit_rec.old_value := :old.TEST_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_TYPE';
        audit_rec.old_value := :old.TEST_TYPE;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_DATE';
        audit_rec.old_value := TO_CHAR(:old.TEST_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_RESULT';
        audit_rec.old_value := :old.TEST_RESULT;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'LICENSED_FLAG';
        audit_rec.old_value := :old.LICENSED_FLAG;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'CONFIRM_STATUS';
        audit_rec.old_value := :old.CONFIRM_STATUS;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'UNIT_ID';
        audit_rec.old_value := :old.UNIT_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'TEST_SEQ_NO';
        audit_rec.old_value := :old.TEST_SEQ_NO;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.PRIMARY_RULE_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'RULE_ID';
        audit_rec.old_value := :old.RULE_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.INSERT_USER;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        insert_audit_rec(audit_rec);


END;
```
