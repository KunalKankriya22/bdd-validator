---
tags:
  - trigger
  - DONSYS
---
# DONATIONS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
if :new.insert_user is null then
   select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
   into :new.insert_user from dual ;
end if;
if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;
if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
end if;
end ;
```
