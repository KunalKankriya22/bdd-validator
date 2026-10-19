---
tags:
  - trigger
  - GTSHIP
---
# GELTUBE_PLASMA_DETAILS_BU

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]
**Table**: [[schemas/GTSHIP/Tables/GELTUBE_PLASMA_DETAILS|GELTUBE_PLASMA_DETAILS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec geltube_plasma_details_adt%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in geltube_plasma_details_adt%rowtype
    ) IS
    BEGIN
        INSERT INTO geltube_plasma_details_adt VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
--
    IF nvl(:old.unit_id, '*') != nvl(:new.unit_id, '*') THEN
        audit_rec.column_name := 'UNIT_ID';
        audit_rec.old_value := :old.unit_id;
        audit_rec.new_value := :new.unit_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.chapter_id;
        audit_rec.new_value := :new.chapter_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.checkin_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.checkin_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'CHECKIN_DATE';
        audit_rec.old_value := TO_CHAR(:old.checkin_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.checkin_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.tube_status, '*') != nvl(:new.tube_status, '*') THEN
        audit_rec.column_name := 'TUBE_STATUS';
        audit_rec.old_value := :old.tube_status;
        audit_rec.new_value := :new.tube_status;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.tube_checkin_user, '*') != nvl(:new.tube_checkin_user, '*') THEN
        audit_rec.column_name := 'TUBE_CHECKIN_USER';
        audit_rec.old_value := :old.tube_checkin_user;
        audit_rec.new_value := :new.tube_checkin_user;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.prod_code, '*') != nvl(:new.prod_code, '*') THEN
        audit_rec.column_name := 'PROD_CODE';
        audit_rec.old_value := :old.prod_code;
        audit_rec.new_value := :new.prod_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.DELETE_REASON, '*') != nvl(:new.DELETE_REASON, '*') THEN
        audit_rec.column_name := 'DELETE_REASON';
        audit_rec.old_value := :old.DELETE_REASON;
        audit_rec.new_value := :new.DELETE_REASON;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.COLL_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.COLL_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'COLL_DATE';
        audit_rec.old_value := TO_CHAR(:old.COLL_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.COLL_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

END;
```
