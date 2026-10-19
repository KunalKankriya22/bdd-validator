---
tags:
  - trigger
  - DONSYS
---
# STAFF_SCHEDULE_DETAILS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/STAFF_SCHEDULE_DETAILS|STAFF_SCHEDULE_DETAILS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
 update staff_schedule_hdr
  set	last_modified_date = sysdate
 where	schedule_id = :new.schedule_id
  and	chapter_id = :new.chapter_id ;
end;
```
