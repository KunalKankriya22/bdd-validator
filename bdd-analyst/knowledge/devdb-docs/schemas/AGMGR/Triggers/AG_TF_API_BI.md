---
tags:
  - trigger
  - AGMGR
---
# AG_TF_API_BI

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/AG_TF_API|AG_TF_API]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    IF :new.bc_insert_date IS NULL THEN
        :new.bc_insert_date := SYSDATE;
    END IF;
END;
```
