---
tags:
  - trigger
  - SBCSYS
---
# NOTE_BOOKS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/NOTE_BOOKS|NOTE_BOOKS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
if :new.insert_user is null then
   select lt_user_session.get_userid
   into :new.insert_user from dual ;
end if;
if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;
if :new.audit_key is null then
   select AUDIT_SEQ_LAB.nextval into :new.audit_key from dual;
end if;
end ;
```
