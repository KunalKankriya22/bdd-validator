---
tags:
  - trigger
  - SBCSYS
---
# RGT_SCHEDULE_EXTRACT_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_SCHEDULE_EXTRACT|RGT_SCHEDULE_EXTRACT]]
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
     insert into RGT_SCHEDULE_EXTRACT_AUDIT
    (
	FILE_NAME, EXTRACT_DATE_TIME, STATUS,
	CHAPTER_ID, CONTRACT_ID, RESULT_PARM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.FILE_NAME, :new.EXTRACT_DATE_TIME, :new.STATUS,
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.RESULT_PARM_ID,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
