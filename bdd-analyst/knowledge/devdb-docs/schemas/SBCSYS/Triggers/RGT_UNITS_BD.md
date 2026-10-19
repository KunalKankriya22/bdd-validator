---
tags:
  - trigger
  - SBCSYS
---
# RGT_UNITS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_UNITS|RGT_UNITS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_UNITS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, BATCH_ID,
	UNIT_ID, PROFILE_TESTS, STAT_TESTS,
	UPLOAD_STATUS, COLL_DATE, COLLECTION_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.BATCH_ID,
	:old.UNIT_ID, :old.PROFILE_TESTS, :old.STAT_TESTS,
	:old.UPLOAD_STATUS, :old.COLL_DATE, :old.COLLECTION_DATE,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
