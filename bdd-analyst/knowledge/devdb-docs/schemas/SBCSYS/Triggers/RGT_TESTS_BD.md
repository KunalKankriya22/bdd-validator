---
tags:
  - trigger
  - SBCSYS
---
# RGT_TESTS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_TESTS|RGT_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_TESTS_audit
    (
	CHAPTER_ID, CONTRACT_ID, BATCH_ID,
	UNIT_ID, TEST_ID, TEST_SCHEDULE_STAT,
	AUDIT_KEY, audit_insert_dats, audit_insert_user
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.BATCH_ID,
	:old.UNIT_ID, :old.TEST_ID, :old.TEST_SCHEDULE_STAT,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
