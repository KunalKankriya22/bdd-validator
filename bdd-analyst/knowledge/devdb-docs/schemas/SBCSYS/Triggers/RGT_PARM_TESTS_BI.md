---
tags:
  - trigger
  - SBCSYS
---
# RGT_PARM_TESTS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_PARM_TESTS|RGT_PARM_TESTS]]
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
    insert into RGT_PARM_TESTS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, TEST_ID,
	PARM_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.TEST_ID,
	:new.PARM_ID, :new.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
```
