---
tags:
  - trigger
  - UTIL
---
# RPT_PARM_BI

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/RPT_PARM|RPT_PARM]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
  IF :new.chapter_id IS NULL THEN
    :new.chapter_id := lt_user_session.get_chapter_id;
  END IF;
END;



```
