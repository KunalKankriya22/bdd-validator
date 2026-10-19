---
tags:
  - trigger
  - SBCSYS
---
# BC_SPATR_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/BC_SPATR|BC_SPATR]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
  IF :new.insert_user IS NULL THEN
     select lt_user_session.get_userid
     into :new.insert_user from dual ;
  END IF;
  IF :new.insert_dats IS NULL THEN
     :new.insert_dats := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT AUDIT_SEQ_LAB.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
```
