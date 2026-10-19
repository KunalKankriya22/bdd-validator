---
tags:
  - trigger
  - SBCSYS
---
# VALID_BAND_RESULTS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_BAND_RESULTS|VALID_BAND_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    VALID_BAND_RESULTS_aud	      VALID_BAND_RESULTS_AUDIT%rowtype;
begin
    VALID_BAND_RESULTS_aud.audit_key := :old.audit_key;
    VALID_BAND_RESULTS_aud.program_id := :new.program_id;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       VALID_BAND_RESULTS_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.RESULT,'*') !=
       nvl(:new.RESULT,'*')
    then
       VALID_BAND_RESULTS_aud.RESULT:= nvl(:new.RESULT,'*');
    end if;
    if nvl(:old.RESULT_SEQ,-1) !=
       nvl(:new.RESULT_SEQ,-1)
    then
       VALID_BAND_RESULTS_aud.RESULT_SEQ:= nvl(:new.RESULT_SEQ,-1);
    end if;
    if nvl(:old.RESULT_DESC,'*') !=
       nvl(:new.RESULT_DESC,'*')
    then
       VALID_BAND_RESULTS_aud.RESULT_DESC:= nvl(:new.RESULT_DESC,'*');
    end if;


    --
    insert into VALID_BAND_RESULTS_AUDIT
    (
	TEST_ID, RESULT, RESULT_SEQ,
	RESULT_DESC, PROGRAM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	VALID_BAND_RESULTS_aud.TEST_ID, VALID_BAND_RESULTS_aud.RESULT, VALID_BAND_RESULTS_aud.RESULT_SEQ,
	VALID_BAND_RESULTS_aud.RESULT_DESC, VALID_BAND_RESULTS_aud.PROGRAM_ID,
	VALID_BAND_RESULTS_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
