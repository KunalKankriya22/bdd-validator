---
tags:
  - trigger
  - SRVSYS
---
# VSERV_ERRORS_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_ERRORS|VSERV_ERRORS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
  (	:old.ERROR_CODE,
	:old.ERROR_TYPE,
	:old.ERROR,
	:old.APPL_NAME,
	:old.AUDIT_FLAG,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
