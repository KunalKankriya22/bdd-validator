---
tags:
  - trigger
  - SRVSYS
---
# SHELVES_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/SHELVES|SHELVES]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
  temp_audit_key	number(23);
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
  from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL');
  insert into SHELVES_AUDIT
  (	CHAPTER_ID,
	WAREHOUSE_ID,
	DEVICE_TYPE,
	DEVICE_NUMBER,
	RACK_NUMBER,
	SHELF_NUMBER,
	SHELF_DESCRIPTION,
	SHELF_TRAY_COUNT,
	EFFECTIVE_DATE,
	LAST_MODIFIED_DATE,
	TERM_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.CHAPTER_ID,
	:new.WAREHOUSE_ID,
	:new.DEVICE_TYPE,
	:new.DEVICE_NUMBER,
	:new.RACK_NUMBER,
	:new.SHELF_NUMBER,
	:new.SHELF_DESCRIPTION,
	:new.SHELF_TRAY_COUNT,
	:new.EFFECTIVE_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.TERM_DATE,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
```
