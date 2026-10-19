---
tags:
  - trigger
  - SBCSYS
---
# TEST_BATCH_CONTROLS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BATCH_CONTROLS|TEST_BATCH_CONTROLS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

    insert into TEST_BATCH_CONTROLS_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, TEST_ID,
	CUT_OFF_VALUE, REF_RESULT, REF_RATIO,
	REF_CONTROL, REF_ABSORBANCE, INSERT_DATS,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.TB_ID, :old.TEST_CHAPTER_ID, :old.TEST_ID,
	:old.CUT_OFF_VALUE, :old.REF_RESULT, :old.REF_RATIO,
	:old.REF_CONTROL, :old.REF_ABSORBANCE, :old.INSERT_DATS,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
