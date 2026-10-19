---
tags:
  - trigger
  - UTIL
---
# LT_DOCUMENT_LIBRARY_BI

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/LT_DOCUMENT_LIBRARY|LT_DOCUMENT_LIBRARY]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
  IF :new.insert_user IS NULL THEN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT audit_seq.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
```
