---
tags:
  - trigger
  - SBCSYS
---
# TEST_BATCH_CONTROLS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BATCH_CONTROLS|TEST_BATCH_CONTROLS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;

           --

   insert into TEST_BATCH_CONTROLS_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, TEST_ID,
	CUT_OFF_VALUE, REF_RESULT, REF_RATIO,
	REF_CONTROL, REF_ABSORBANCE, INSERT_DATS,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.TB_ID, :new.TEST_CHAPTER_ID, :new.TEST_ID,
	:new.CUT_OFF_VALUE, :new.REF_RESULT, :new.REF_RATIO,
	:new.REF_CONTROL, :new.REF_ABSORBANCE, :new.INSERT_DATS,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
