---
tags:
  - trigger
  - SBCSYS
---
# RGT_UNITS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_UNITS|RGT_UNITS]]
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
    insert into RGT_UNITS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, BATCH_ID,
	UNIT_ID, PROFILE_TESTS, STAT_TESTS,
	UPLOAD_STATUS, COLL_DATE, COLLECTION_DATE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.CHAPTER_ID, :new.CONTRACT_ID, :new.BATCH_ID,
	:new.UNIT_ID, :new.PROFILE_TESTS, :new.STAT_TESTS,
	:new.UPLOAD_STATUS, :new.COLL_DATE, :new.COLLECTION_DATE,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
