---
tags:
  - trigger
  - DONSYS
---
# DONOR_DISTRIBUTION_WEIGHTS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_DISTRIBUTION_WEIGHTS|DONOR_DISTRIBUTION_WEIGHTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
```
