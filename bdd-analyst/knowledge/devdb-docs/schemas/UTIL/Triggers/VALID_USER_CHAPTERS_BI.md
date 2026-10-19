---
tags:
  - trigger
  - UTIL
---
# VALID_USER_CHAPTERS_BI

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/VALID_USER_CHAPTERS|VALID_USER_CHAPTERS]]
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
