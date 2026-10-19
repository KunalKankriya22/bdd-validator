---
tags:
  - trigger
  - SBCSYS
---
# RGT_SCHEDULE_EXTRACT_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_SCHEDULE_EXTRACT|RGT_SCHEDULE_EXTRACT]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_SCHEDULE_EXTRACT_AUDIT
    (
	FILE_NAME, EXTRACT_DATE_TIME, STATUS,
	CHAPTER_ID, CONTRACT_ID, RESULT_PARM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.FILE_NAME, :old.EXTRACT_DATE_TIME, :old.STATUS,
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.RESULT_PARM_ID,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
