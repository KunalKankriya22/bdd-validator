---
tags:
  - trigger
  - SBCSYS
---
# TEST_BAND_DETAIL_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BAND_DETAIL|TEST_BAND_DETAIL]]
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
   insert into TEST_BAND_DETAIL_AUDIT
    (
	UNIT_ID, COLL_DATE, CHAPTER_ID,
	TB_ID, TEST_ID, TB_SEQ_NO,
	TEST_CHAPTER_ID, BAND_NAME, TECH1_BAND_VAL,
	TECH2_BAND_VAL, SUPER_BAND_VAL, PROGRAM_ID, BAND_SEQ,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.UNIT_ID, :new.COLL_DATE, :new.CHAPTER_ID,
	:new.TB_ID, :new.TEST_ID, :new.TB_SEQ_NO,
	:new.TEST_CHAPTER_ID, :new.BAND_NAME, :new.TECH1_BAND_VAL,
	:new.TECH2_BAND_VAL, :new.SUPER_BAND_VAL, :new.PROGRAM_ID, :new.BAND_SEQ,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
