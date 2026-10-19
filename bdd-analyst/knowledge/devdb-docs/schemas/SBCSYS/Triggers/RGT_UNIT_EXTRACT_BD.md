---
tags:
  - trigger
  - SBCSYS
---
# RGT_UNIT_EXTRACT_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_UNIT_EXTRACT|RGT_UNIT_EXTRACT]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_UNIT_EXTRACT_audit
    (
	PARM_ID, UNIT_ID,CHAPTER_ID,
	CONTRACT_ID, COLL_DATE, BATCH_ID,
	TEST_SEQ_NO, TEST_ID,
	AUDIT_KEY,audit_insert_dats, audit_insert_user
    )
    values
    (
	:old.PARM_ID, :old.UNIT_ID, :old.CHAPTER_ID,
	:old.CONTRACT_ID, :old.COLL_DATE, :old.BATCH_ID,
	:old.TEST_SEQ_NO, :old.TEST_ID,
	:old.AUDIT_KEY,sysdate, lt_user_session.get_userid
    );
end;
```
