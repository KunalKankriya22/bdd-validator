---
tags:
  - trigger
  - SBCSYS
---
# TEST_VOIDS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_VOIDS|TEST_VOIDS]]
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

    insert into TEST_VOIDS_AUDIT
    (
	UNIT_ID, COLL_DATE, CHAPTER_ID,
	TEST_SEQ_NO, TEST_ID, TEST_STATE,
	TEST_MODE, RESULT_STATUS_1, RESULT_STATUS_2,
	EDIT_RESULT_FLAG, TB_ID, TEST_CHAPTER_ID,
	TB_SEQ_NO, WELL_NUMBER, ABSORBANCE,
	RATIO, RESULT_DATS, RESULT_USER_ID,
	TESTING_LAB_CODE, INSERT_DATS, INSERT_USER_ID,
	VOID_TYPE, VOID_REASON_CODE, VOID_DATS, VOID_USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.UNIT_ID, :new.COLL_DATE, :new.CHAPTER_ID,
	:new.TEST_SEQ_NO, :new.TEST_ID, :new.TEST_STATE,
	:new.TEST_MODE, :new.RESULT_STATUS_1, :new.RESULT_STATUS_2,
	:new.EDIT_RESULT_FLAG, :new.TB_ID, :new.TEST_CHAPTER_ID,
	:new.TB_SEQ_NO, :new.WELL_NUMBER, :new.ABSORBANCE,
	:new.RATIO, :new.RESULT_DATS, :new.RESULT_USER_ID,
	:new.TESTING_LAB_CODE, :new.INSERT_DATS, :new.INSERT_USER_ID,
	:new.VOID_TYPE, :new.VOID_REASON_CODE, :new.VOID_DATS, :new.VOID_USER_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
