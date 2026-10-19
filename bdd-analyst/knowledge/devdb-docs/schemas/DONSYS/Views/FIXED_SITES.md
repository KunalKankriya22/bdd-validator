---
tags:
  - view
  - DONSYS
---
# FIXED_SITES

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Text Length**: 619 chars

## Referenced Tables

- [[schemas/DONSYS/Tables/LOCATIONS|DONSYS.LOCATIONS]]

## Definition

```sql
select
location_id site_id,
  location_name,
   chapter_id,
   rotation_flag,
   staff_facility
   from locations where location_type in ( 'FIX','F')
   and Lifetrack_timezone_convert.get_local_time(CHAPTER_ID,sysdate) between eff_date and nvl(term_date,Lifetrack_timezone_convert.get_local_time(CHAPTER_ID,sysdate)+1)
   and chapter_id IN (select chapter_id from system_users
       --where user_id = decode(substr(user ,1,3),'OPS',substr(user ,5),user ))
       where user_id = decode(substr(lt_user_session.get_userid ,1,3),'OPS',substr(lt_user_session.get_userid ,5),lt_user_session.get_userid ))
  with read only


```
