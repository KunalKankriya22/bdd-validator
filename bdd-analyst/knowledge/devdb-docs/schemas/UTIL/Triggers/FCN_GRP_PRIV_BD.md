---
tags:
  - trigger
  - UTIL
---
# FCN_GRP_PRIV_BD

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/FCN_GRP_PRIV|FCN_GRP_PRIV]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec FCN_GRP_PRIV_AUDIT%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in FCN_GRP_PRIV_AUDIT%rowtype
    ) IS
    BEGIN
        INSERT INTO FCN_GRP_PRIV_AUDIT VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'USER_ID';
    audit_rec.old_value := :old.USER_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'APPL_ID';
    audit_rec.old_value := :old.APPL_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'GRP_ID';
    audit_rec.old_value := :old.GRP_ID; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'ACC_PRIV';
    audit_rec.old_value := :old.ACC_PRIV; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);  

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec);  

END;
```
