---
tags:
  - trigger
  - DONSYS
---
# ALERT_LOG_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/ALERT_LOG|ALERT_LOG]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    :new.insert_date := sysdate ;
end ;
```
