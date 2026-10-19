---
tags:
  - view
  - DONSYS
---
# DRIVE_SPON

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Text Length**: 908 chars

## Referenced Tables

- [[schemas/DONSYS/Tables/DRIVES|DONSYS.DRIVES]]
- [[schemas/DONSYS/Tables/DRIVE_SPONSORS|DONSYS.DRIVE_SPONSORS]]

## Definition

```sql
select
drives.drive_id,drive_date,drive_type,drives.projected_show,drives.projected_draw,schedule_start_time,schedule_end_time,location_id,name
from drives,drive_sponsors,sponsors
where
drives.chapter_id = (select chapter_id from system_users
                            where user_id = decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid))
and
drive_sponsors.sponsor_id = (select sponsor_id from drive_sponsors
                                   where  drive_id = drives.drive_id
                                   and    chapter_id= drives.chapter_id
                                   and    rownum = 1)
and   drive_sponsors.drive_id = drives.drive_id
and   drive_sponsors.chapter_id = drives.chapter_id
and   sponsors.sponsor_id = drive_sponsors.sponsor_id
and   sponsors.chapter_id = drive_sponsors.chapter_id
and   drives.status !='CANCL'
```
