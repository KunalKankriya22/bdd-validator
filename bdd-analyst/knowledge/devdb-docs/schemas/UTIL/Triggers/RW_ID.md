---
tags:
  - trigger
  - UTIL
---
# RW_ID

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/RW_JOBS|RW_JOBS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
begin     if inserting then       if :NEW."ID" is null then          select REPORTS_JOBS.nextval into :NEW."ID" from dual;       end if;    end if; end;
```
