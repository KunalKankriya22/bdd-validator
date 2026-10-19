---
tags:
  - trigger
  - SRVSYS
---
# TRAYS_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/TRAYS|TRAYS]]
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
  insert into TRAYS_AUDIT
  (	CHAPTER_ID,
	WAREHOUSE_ID,
	DEVICE_TYPE,
	DEVICE_NUMBER,
	RACK_NUMBER,
	SHELF_NUMBER,
	TRAY_NUMBER,
	TRAY_DESCRIPTION,
	PRODUCT_TYPE,
	BLOOD_TYPE,
	ITEM_COUNT,
	TRAY_STATUS,
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
	:new.TRAY_NUMBER,
	:new.TRAY_DESCRIPTION,
	:new.PRODUCT_TYPE,
	:new.BLOOD_TYPE,
	:new.ITEM_COUNT,
	:new.TRAY_STATUS,
	:new.EFFECTIVE_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.TERM_DATE,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
