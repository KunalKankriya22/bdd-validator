---
tags:
  - trigger
  - SBCSYS
---
# RGT_DUP_TUBES_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_DUP_TUBES|RGT_DUP_TUBES]]
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
    insert into RGT_DUP_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, TUBE_TYPE,
	REASON_CODE, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.CBC_UNIT_ID,
	:new.UNIT_ID, :new.TUBE_CHECK_IN_DATE, :new.TUBE_TYPE,
	:new.REASON_CODE, :new.AUDIT_KEY,	:new.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
```
