---
tags:
  - trigger
  - SBCSYS
---
# RGT_SKIP_SAMPLES_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_SKIP_SAMPLES|RGT_SKIP_SAMPLES]]
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
    insert into RGT_SKIP_SAMPLES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, UNIT_ID,
	COLL_DATE, SKIP_FLAG, INSERT_DATE,
	INSERT_USER_ID, REASON_CODE, RESET_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.UNIT_ID,
	:new.COLL_DATE, :new.SKIP_FLAG, :new.INSERT_DATE,
	:new.INSERT_USER_ID, :new.REASON_CODE, :new.RESET_DATE,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
