---
tags:
  - trigger
  - AGMGR
---
# VALID_ANTIGEN_CONFIG_HDR_BU

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/VALID_ANTIGEN_CONFIG_HDR|VALID_ANTIGEN_CONFIG_HDR]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
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
    audit_rec.program_id := :new.PROGRAM_ID;
    audit_rec.user_id := lt_user_session.get_userid;
    audit_rec.action_code := 'U';

    IF nvl(:old.ANTIGEN_GROUP, '*') != nvl(:new.ANTIGEN_GROUP, '*') THEN
        audit_rec.column_name := 'ANTIGEN_GROUP';
        audit_rec.old_value := :old.ANTIGEN_GROUP;
        audit_rec.new_value := :new.ANTIGEN_GROUP;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.ANTIGEN_CODE, '*') != nvl(:new.ANTIGEN_CODE, '*') THEN
        audit_rec.column_name := 'ANTIGEN_CODE';
        audit_rec.old_value := :old.ANTIGEN_CODE;
        audit_rec.new_value := :new.ANTIGEN_CODE;
        insert_audit_rec(audit_rec);
    END IF;    

    IF nvl(:old.LABELING_ANTIGEN_CODE, '*') != nvl(:new.LABELING_ANTIGEN_CODE, '*') THEN
        audit_rec.column_name := 'LABELING_ANTIGEN_CODE';
        audit_rec.old_value := :old.LABELING_ANTIGEN_CODE;
        audit_rec.new_value := :new.LABELING_ANTIGEN_CODE;
        insert_audit_rec(audit_rec);
    END IF; 

    IF nvl(:old.NO_OF_UNITS, 0) != nvl(:new.NO_OF_UNITS, 0) THEN
        audit_rec.column_name := 'NO_OF_UNITS';
        audit_rec.old_value := :old.NO_OF_UNITS;
        audit_rec.new_value := :new.NO_OF_UNITS;
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

    IF nvl(:old.PRIMARY_RULE_ID, 0) != nvl(:new.PRIMARY_RULE_ID, 0) THEN
        audit_rec.column_name := 'PRIMARY_RULE_ID';
        audit_rec.old_value := :old.PRIMARY_RULE_ID;
        audit_rec.new_value := :new.PRIMARY_RULE_ID;
        insert_audit_rec(audit_rec);
    END IF;  

    IF nvl(:old.CHAPTER_ID, '*') != nvl(:new.CHAPTER_ID, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.CHAPTER_ID;
        audit_rec.new_value := :new.CHAPTER_ID;
        insert_audit_rec(audit_rec);
    END IF;      
end;
```
