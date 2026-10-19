---
tags:
  - trigger
  - SBCSYS
---
# RGT_INTERIM_RESULTS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_INTERIM_RESULTS|RGT_INTERIM_RESULTS]]
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
    insert into RGT_INTERIM_RESULTS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, UNIT_ID,
	BATCH_ID, TEST_ID, TEST_SEQ_NO,
	RESULT_CODE, INSERT_USER_ID, INSERT_DATS,
	EXTRACT_FLAG, FIRST_EXTRACT_DATE, LAST_EXTRACT_DATE,
	RESULT_FLAG, COLL_DATE, RESULTS_QC_DATE,
	RESULTS_QC_USER, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.UNIT_ID,
	:new.BATCH_ID, :new.TEST_ID, :new.TEST_SEQ_NO,
	:new.RESULT_CODE, :new.INSERT_USER_ID, :new.INSERT_DATS,
	:new.EXTRACT_FLAG, :new.FIRST_EXTRACT_DATE, :new.LAST_EXTRACT_DATE,
	:new.RESULT_FLAG, :new.COLL_DATE, :new.RESULTS_QC_DATE,
	:new.RESULTS_QC_USER, :new.AUDIT_KEY, :new.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
```
