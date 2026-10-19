---
tags:
  - trigger
  - AGMGR
---
# AG_DONOR_TESTS_DET_BU

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/AG_DONOR_TESTS_DET|AG_DONOR_TESTS_DET]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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

    IF nvl(:old.TEST_ID, '*') != nvl(:new.TEST_ID, '*') THEN
        audit_rec.column_name := 'TEST_ID';
        audit_rec.old_value := :old.TEST_ID;
        audit_rec.new_value := :new.TEST_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TEST_TYPE, '*') != nvl(:new.TEST_TYPE, '*') THEN
        audit_rec.column_name := 'TEST_TYPE';
        audit_rec.old_value := :old.TEST_TYPE;
        audit_rec.new_value := :new.TEST_TYPE;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TEST_DATE, to_date('01-JAN-33')) != nvl(:new.TEST_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'TEST_DATE';
        audit_rec.old_value := TO_CHAR(:old.TEST_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.TEST_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TEST_RESULT, '*') != nvl(:new.TEST_RESULT, '*') THEN
        audit_rec.column_name := 'TEST_RESULT';
        audit_rec.old_value := :old.TEST_RESULT;
        audit_rec.new_value := :new.TEST_RESULT;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.LICENSED_FLAG, '*') != nvl(:new.LICENSED_FLAG, '*') THEN
        audit_rec.column_name := 'LICENSED_FLAG';
        audit_rec.old_value := :old.LICENSED_FLAG;
        audit_rec.new_value := :new.LICENSED_FLAG;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.CONFIRM_STATUS, '*') != nvl(:new.CONFIRM_STATUS, '*') THEN
        audit_rec.column_name := 'CONFIRM_STATUS';
        audit_rec.old_value := :old.CONFIRM_STATUS;
        audit_rec.new_value := :new.CONFIRM_STATUS;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.INSERT_DATE, to_date('01-JAN-33')) != nvl(:new.INSERT_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.UNIT_ID, '*') != nvl(:new.UNIT_ID, '*') THEN
        audit_rec.column_name := 'UNIT_ID';
        audit_rec.old_value := :old.UNIT_ID;
        audit_rec.new_value := :new.UNIT_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TEST_SEQ_NO, 0) != nvl(:new.TEST_SEQ_NO, 0) THEN
        audit_rec.column_name := 'TEST_SEQ_NO';
        audit_rec.old_value := :old.TEST_SEQ_NO;
        audit_rec.new_value := :new.TEST_SEQ_NO;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PRIMARY_RULE_ID, 0) != nvl(:new.PRIMARY_RULE_ID, 0) THEN
        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.PRIMARY_RULE_ID;
        audit_rec.new_value := :new.PRIMARY_RULE_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.RULE_ID, 0) != nvl(:new.RULE_ID, 0) THEN
        audit_rec.column_name := 'RULE_ID';
        audit_rec.old_value := :old.RULE_ID;
        audit_rec.new_value := :new.RULE_ID;
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
```
