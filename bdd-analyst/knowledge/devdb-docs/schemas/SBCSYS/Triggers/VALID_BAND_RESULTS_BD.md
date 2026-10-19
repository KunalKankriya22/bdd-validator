---
tags:
  - trigger
  - SBCSYS
---
# VALID_BAND_RESULTS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_BAND_RESULTS|VALID_BAND_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

    insert into VALID_BAND_RESULTS_AUDIT
    (
	TEST_ID, RESULT, RESULT_SEQ,
	RESULT_DESC, PROGRAM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.TEST_ID, :old.RESULT, :old.RESULT_SEQ,
	:old.RESULT_DESC, :old.PROGRAM_ID,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
