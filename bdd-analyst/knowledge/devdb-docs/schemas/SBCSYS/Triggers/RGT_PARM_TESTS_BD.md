---
tags:
  - trigger
  - SBCSYS
---
# RGT_PARM_TESTS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_PARM_TESTS|RGT_PARM_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_PARM_TESTS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, TEST_ID,
	PARM_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.TEST_ID,
	:old.PARM_ID, :old.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
```
