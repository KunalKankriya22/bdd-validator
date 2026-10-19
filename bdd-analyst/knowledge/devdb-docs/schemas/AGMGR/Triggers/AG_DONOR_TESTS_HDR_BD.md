---
tags:
  - trigger
  - AGMGR
---
# AG_DONOR_TESTS_HDR_BD

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/AG_DONOR_TESTS_HDR|AG_DONOR_TESTS_HDR]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
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

        audit_rec.column_name := 'RESULT_CODE';
        audit_rec.old_value := :old.RESULT_CODE;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'CONFIRM_FLAG';
        audit_rec.old_value := :old.CONFIRM_FLAG;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'CONFIRM_DATE';
        audit_rec.old_value := TO_CHAR(:old.CONFIRM_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'RESULT_PENDING';
        audit_rec.old_value := :old.RESULT_PENDING;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.PRIMARY_RULE_ID;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.INSERT_USER;
        insert_audit_rec(audit_rec);

        audit_rec.column_name := 'PROGRAM_ID';
        audit_rec.old_value := :old.PROGRAM_ID;
        insert_audit_rec(audit_rec);


END;
```
