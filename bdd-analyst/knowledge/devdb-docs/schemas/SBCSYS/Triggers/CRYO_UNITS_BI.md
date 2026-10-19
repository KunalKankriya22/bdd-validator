---
tags:
  - trigger
  - SBCSYS
---
# CRYO_UNITS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/CRYO_UNITS|CRYO_UNITS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
  IF :new.INSERT_USER_ID IS NULL THEN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.INSERT_USER_ID from dual ;
  END IF;
  IF :new.INSERT_DATS IS NULL THEN
     :new.INSERT_DATS := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT audit_seq_lab.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
```
