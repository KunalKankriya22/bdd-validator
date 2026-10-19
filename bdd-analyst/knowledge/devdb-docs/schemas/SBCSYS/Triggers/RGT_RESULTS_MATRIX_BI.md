---
tags:
  - trigger
  - SBCSYS
---
# RGT_RESULTS_MATRIX_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_RESULTS_MATRIX|RGT_RESULTS_MATRIX]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN

if :new.INSERT_USER_ID is null then
   :new.INSERT_USER_ID:=lt_user_session.get_userid;
end if;

if :new.audit_key is null then
   select AUDIT_SEQ_LAB.nextval into :new.audit_key from dual;
end if;
end ;
```
