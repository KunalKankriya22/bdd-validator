---
tags:
  - trigger
  - SRVSYS
---
# STORAGE_DEVICES_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/STORAGE_DEVICES|STORAGE_DEVICES]]
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
  insert into STORAGE_DEVICES_AUDIT
  (	CHAPTER_ID,
	WAREHOUSE_ID,
	DEVICE_TYPE,
	DEVICE_NUMBER,
	DEVICE_DESCRIPTION,
	DEVICE_STATUS,
	RACK_COUNT,
	INSTALL_DATE,
	LAST_SERVICE_DATE,
	NEXT_SERVICE_DATE,
	LAST_TEMPARATURE,
	TEMP_READ_DATE,
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
	:new.DEVICE_DESCRIPTION,
	:new.DEVICE_STATUS,
	:new.RACK_COUNT,
	:new.INSTALL_DATE,
	:new.LAST_SERVICE_DATE,
	:new.NEXT_SERVICE_DATE,
	:new.LAST_TEMPARATURE,
	:new.TEMP_READ_DATE,
	:new.EFFECTIVE_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.TERM_DATE,
    :new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
