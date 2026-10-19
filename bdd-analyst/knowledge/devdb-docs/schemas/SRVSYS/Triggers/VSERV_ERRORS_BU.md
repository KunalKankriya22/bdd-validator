---
tags:
  - trigger
  - SRVSYS
---
# VSERV_ERRORS_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_ERRORS|VSERV_ERRORS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
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
	'UPDATE',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
