---
tags:
  - trigger
  - SBCSYS
---
# VALID_BAND_RESULTS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_BAND_RESULTS|VALID_BAND_RESULTS]]
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
    :new.program_id := nvl(:new.program_id,'MANUAL');

           --

   insert into VALID_BAND_RESULTS_AUDIT
    (
	TEST_ID, RESULT, RESULT_SEQ,
	RESULT_DESC, PROGRAM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.TEST_ID, :new.RESULT, :new.RESULT_SEQ,
	:new.RESULT_DESC, :new.PROGRAM_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
