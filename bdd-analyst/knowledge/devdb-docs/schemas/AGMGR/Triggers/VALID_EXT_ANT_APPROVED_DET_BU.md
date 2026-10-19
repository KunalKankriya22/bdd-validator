---
tags:
  - trigger
  - AGMGR
---
# VALID_EXT_ANT_APPROVED_DET_BU

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/VALID_EXT_ANT_APPROVED_DET|VALID_EXT_ANT_APPROVED_DET]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec valid_ext_ant_approved_det_adt%rowtype;
    PROCEDURE insert_audit_rec (
        rec_in valid_ext_ant_approved_det_adt%rowtype
    ) IS
    BEGIN

        INSERT INTO valid_ext_ant_approved_det_adt VALUES rec_in;

    END insert_audit_rec;    
BEGIN
    audit_rec.audit_key := :old.AUDIT_KEY;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id := :new.PROGRAM_ID;
    audit_rec.user_id := lt_user_session.get_userid;
    audit_rec.action_code := 'U';

    IF nvl(:old.TEST_ANTIGEN, '*') != nvl(:new.TEST_ANTIGEN, '*') THEN
        audit_rec.column_name := 'TEST_ANTIGEN';
        audit_rec.old_value := :old.TEST_ANTIGEN;
        audit_rec.new_value := :new.TEST_ANTIGEN;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.APPROVED_FLAG, '*') != nvl(:new.APPROVED_FLAG, '*') THEN
        audit_rec.column_name := 'APPROVED_FLAG';
        audit_rec.old_value := :old.APPROVED_FLAG;
        audit_rec.new_value := :new.APPROVED_FLAG;
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

    IF nvl(:old.EXT_FAC_CODE, '*') != nvl(:new.EXT_FAC_CODE, '*') THEN
        audit_rec.column_name := 'EXT_FAC_CODE';
        audit_rec.old_value := :old.EXT_FAC_CODE;
        audit_rec.new_value := :new.EXT_FAC_CODE;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TEST_BATCH_PREFIX, '*') != nvl(:new.TEST_BATCH_PREFIX, '*') THEN
        audit_rec.column_name := 'TEST_BATCH_PREFIX';
        audit_rec.old_value := :old.TEST_BATCH_PREFIX;
        audit_rec.new_value := :new.TEST_BATCH_PREFIX;
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

    IF nvl(:old.CHAPTER_ID, '*') != nvl(:new.CHAPTER_ID, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.CHAPTER_ID;
        audit_rec.new_value := :new.CHAPTER_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.MODIFIED_DATE, to_date('01-JAN-33')) != nvl(:new.MODIFIED_DATE, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'MODIFIED_DATE';
        audit_rec.old_value := TO_CHAR(:old.MODIFIED_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.MODIFIED_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.MODIFIED_USER, '*') != nvl(:new.MODIFIED_USER, '*') THEN
        audit_rec.column_name := 'MODIFIED_USER';
        audit_rec.old_value := :old.MODIFIED_USER;
        audit_rec.new_value := :new.MODIFIED_USER;
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
