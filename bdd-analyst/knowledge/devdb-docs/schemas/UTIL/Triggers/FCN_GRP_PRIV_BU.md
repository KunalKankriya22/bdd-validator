---
tags:
  - trigger
  - UTIL
---
# FCN_GRP_PRIV_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/FCN_GRP_PRIV|FCN_GRP_PRIV]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec fcn_grp_priv_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in fcn_grp_priv_audit%rowtype
    ) IS
    BEGIN

        INSERT INTO fcn_grp_priv_audit VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
	--

    IF nvl(:old.USER_ID, '*') != nvl(:new.USER_ID, '*') THEN
        audit_rec.column_name := 'USER_ID';
        audit_rec.old_value := :old.USER_ID;
        audit_rec.new_value := :new.USER_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.APPL_ID, '*') != nvl(:new.APPL_ID, '*') THEN
        audit_rec.column_name := 'APPL_ID';
        audit_rec.old_value := :old.APPL_ID;
        audit_rec.new_value := :new.APPL_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.GRP_ID, '*') != nvl(:new.GRP_ID, '*') THEN
        audit_rec.column_name := 'GRP_ID';
        audit_rec.old_value := :old.GRP_ID;
        audit_rec.new_value := :new.GRP_ID;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.ACC_PRIV, -1) != nvl(:new.ACC_PRIV, -1) THEN
        audit_rec.column_name := 'ACC_PRIV';
        audit_rec.old_value := :old.ACC_PRIV;
        audit_rec.new_value := :new.ACC_PRIV;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.INSERT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.INSERT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.INSERT_DATE, 'MM-DD-YYYY');
        audit_rec.new_value := TO_CHAR(:new.INSERT_DATE, 'MM-DD-YYYY');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.INSERT_USER, '*') != nvl(:new.INSERT_USER, '*') THEN
        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.INSERT_USER;
        audit_rec.new_value := :new.INSERT_USER;
        insert_audit_rec(audit_rec);    
    END IF;


	--
END;
```
