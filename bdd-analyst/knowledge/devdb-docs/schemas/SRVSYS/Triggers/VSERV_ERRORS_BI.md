---
tags:
  - trigger
  - SRVSYS
---
# VSERV_ERRORS_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_ERRORS|VSERV_ERRORS]]
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
  insert into VSERV_ERRORS_AUDIT
  (	ERROR_CODE,
	ERROR_TYPE,
	ERROR,
	APPL_NAME,
	AUDIT_FLAG,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.ERROR_CODE,
	:new.ERROR_TYPE,
	:new.ERROR,
	:new.APPL_NAME,
	:new.AUDIT_FLAG,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
