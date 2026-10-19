---
tags:
  - trigger
  - SBCSYS
---
# RGT_RESULTS_BATCH_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_RESULTS_BATCH|RGT_RESULTS_BATCH]]
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
     insert into RGT_RESULTS_BATCH_AUDIT
    (
	CHAPTER_ID, RESULT_BATCH_ID, PARM_ID,
	EXTRACT_DATE, EXTRACT_USER_ID, BATCH_STATUS_FLAG,
	UNIT_COUNT, CONTRACT_ID, UNDER_EXTRACT_FLAG,
	RESULT_TYPE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.RESULT_BATCH_ID, :new.PARM_ID,
	:new.EXTRACT_DATE, :new.EXTRACT_USER_ID, :new.BATCH_STATUS_FLAG,
	:new.UNIT_COUNT, :new.CONTRACT_ID, :new.UNDER_EXTRACT_FLAG,
	:new.RESULT_TYPE,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
