---
tags:
  - trigger
  - SBCSYS
---
# RGT_NON_PROFILE_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_NON_PROFILE|RGT_NON_PROFILE]]
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
    insert into RGT_NON_PROFILE_AUDIT
    (
	CONTRACT_ID, CHAPTER_ID, TEST_ID,
	EFF_DATE, TERM_DATE, LAST_MODIFIED_DATE,
	LAST_MODIFIED_USER, TEST_GROUP, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CONTRACT_ID, :new.CHAPTER_ID, :new.TEST_ID,
	:new.EFF_DATE, :new.TERM_DATE, :new.LAST_MODIFIED_DATE,
	:new.LAST_MODIFIED_USER, :new.TEST_GROUP, :new.AUDIT_KEY, :new.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
```
