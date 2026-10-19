---
tags:
  - trigger
  - DONSYS
---
# MERGED_DONORS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/MERGED_DONORS|MERGED_DONORS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    ld_local_time   DATE;
BEGIN
    SELECT
        decode(substr(lt_user_session.get_userid, 1, 3), 'OPS', substr(lt_user_session.get_userid, 5), lt_user_session.get_userid)
    INTO :new.insert_user
    FROM
        dual;

    :new.insert_date := sysdate;
END;
```
