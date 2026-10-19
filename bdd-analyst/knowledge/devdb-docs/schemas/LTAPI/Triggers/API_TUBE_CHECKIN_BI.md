---
tags:
  - trigger
  - LTAPI
---
# API_TUBE_CHECKIN_BI

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_TUBE_CHECKIN|API_TUBE_CHECKIN]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN


if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;


end ;
```
