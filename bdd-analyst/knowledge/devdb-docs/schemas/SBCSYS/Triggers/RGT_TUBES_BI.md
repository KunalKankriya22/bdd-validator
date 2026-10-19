---
tags:
  - trigger
  - SBCSYS
---
# RGT_TUBES_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_TUBES|RGT_TUBES]]
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
    insert into RGT_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, RED1_FLAG,
	RED2_FLAG, PURPLE1_FLAG, PURPLE2_FLAG,
	PROGRAM_ID, BATCH_ID, USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.CBC_UNIT_ID,
	:new.UNIT_ID, :new.TUBE_CHECK_IN_DATE, :new.RED1_FLAG,
	:new.RED2_FLAG, :new.PURPLE1_FLAG, :new.PURPLE2_FLAG,
	:new.PROGRAM_ID, :new.BATCH_ID, :new.USER_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
