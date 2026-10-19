---
tags:
  - trigger
  - SBCSYS
---
# RGT_RESULT_PARMS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_RESULT_PARMS|RGT_RESULT_PARMS]]
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
    insert into RGT_RESULT_PARMS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, RESULT_PARM_ID,
	FROM_DATE, TO_DATE, INSERT_DATS,
	INSERT_USER_ID, BATCH_ID, UNIT_LIST,
	STAT_TESTS, RESULT_TYPE, OTHER_BATCHES,
	UNIT_COUNT, UNDER_EXTRACT_FLAG, RE_EXTRACT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.RESULT_PARM_ID,
	:new.FROM_DATE, :new.TO_DATE, :new.INSERT_DATS,
	:new.INSERT_USER_ID, :new.BATCH_ID, :new.UNIT_LIST,
	:new.STAT_TESTS, :new.RESULT_TYPE, :new.OTHER_BATCHES,
	:new.UNIT_COUNT, :new.UNDER_EXTRACT_FLAG, :new.RE_EXTRACT_FLAG,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
