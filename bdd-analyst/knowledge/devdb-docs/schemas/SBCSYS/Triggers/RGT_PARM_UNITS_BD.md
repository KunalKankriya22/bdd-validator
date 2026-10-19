---
tags:
  - trigger
  - SBCSYS
---
# RGT_PARM_UNITS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_PARM_UNITS|RGT_PARM_UNITS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RGT_PARM_UNITS_AUDIT
    (
	CHAPTER_ID, UNIT_ID, PARM_ID,
	CONTRACT_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.CHAPTER_ID, :old.UNIT_ID, :old.PARM_ID,
	:old.CONTRACT_ID, :old.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
```
