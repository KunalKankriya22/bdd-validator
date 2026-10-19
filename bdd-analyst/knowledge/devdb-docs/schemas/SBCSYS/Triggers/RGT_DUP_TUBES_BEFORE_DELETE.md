---
tags:
  - trigger
  - SBCSYS
---
# RGT_DUP_TUBES_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_DUP_TUBES|RGT_DUP_TUBES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_DUP_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, TUBE_TYPE,
	REASON_CODE, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.CONTRACT_ID, :old.CBC_UNIT_ID,
	:old.UNIT_ID, :old.TUBE_CHECK_IN_DATE, :old.TUBE_TYPE,
	:old.REASON_CODE, :old.AUDIT_KEY, 'DELETE',
	sysdate, lt_user_session.get_userid
    );
end;
```
