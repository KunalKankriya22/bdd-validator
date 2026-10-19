---
tags:
  - trigger
  - DONSYS
---
# NEW_DONOR_TEMP_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/NEW_DONOR_TEMP|NEW_DONOR_TEMP]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    IF :new.insert_date IS NULL THEN
        :new.insert_date := sysdate;
    END IF;
END;
```
