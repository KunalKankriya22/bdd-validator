---
tags:
  - trigger
  - SBCSYS
---
# TEST_BAND_HEADER_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BAND_HEADER|TEST_BAND_HEADER]]
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

    insert into TEST_BAND_HEADER_AUDIT
    (
	UNIT_ID, COLL_DATE, CHAPTER_ID,
	TB_ID, TEST_ID, TB_SEQ_NO,
	TEST_CHAPTER_ID, TECH1_USER, TECH1_DATE,
	TECH2_USER, TECH2_DATE, SUPER_USER,
	SUPER_DATE, RECON_FLAG, TECH1_INTP,
	TECH2_INTP, SUPER_INTP, PROGRAM_ID,
	NOTE_ID, TEST_TYPE, CTRL_VAL,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.UNIT_ID, :new.COLL_DATE, :new.CHAPTER_ID,
	:new.TB_ID, :new.TEST_ID, :new.TB_SEQ_NO,
	:new.TEST_CHAPTER_ID, :new.TECH1_USER, :new.TECH1_DATE,
	:new.TECH2_USER, :new.TECH2_DATE, :new.SUPER_USER,
	:new.SUPER_DATE, :new.RECON_FLAG, :new.TECH1_INTP,
	:new.TECH2_INTP, :new.SUPER_INTP, :new.PROGRAM_ID,
	:new.NOTE_ID, :new.TEST_TYPE, :new.CTRL_VAL,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
