---
tags:
  - trigger
  - SBCSYS
---
# RGT_RESULTS_BATCH_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_RESULTS_BATCH|RGT_RESULTS_BATCH]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_RESULTS_BATCH_AUDIT
    (
	CHAPTER_ID, RESULT_BATCH_ID, PARM_ID,
	EXTRACT_DATE, EXTRACT_USER_ID, BATCH_STATUS_FLAG,
	UNIT_COUNT, CONTRACT_ID, UNDER_EXTRACT_FLAG,
	RESULT_TYPE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.RESULT_BATCH_ID, :old.PARM_ID,
	:old.EXTRACT_DATE, :old.EXTRACT_USER_ID, :old.BATCH_STATUS_FLAG,
	:old.UNIT_COUNT, :old.CONTRACT_ID, :old.UNDER_EXTRACT_FLAG,
	:old.RESULT_TYPE,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
