---
tags:
  - trigger
  - SRVSYS
---
# VSERV_BILLING_CODES_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_BILLING_CODES|VSERV_BILLING_CODES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  insert into VSERV_BILLING_CODES_AUDIT
  (	BILLING_CODE,
	CODE_DESC,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:old.BILLING_CODE,
	:old.CODE_DESC,
	:old.EFF_DATE,
	:old.TERM_DATE,
	:old.LAST_MODIFIED_DATE,
	:old.AUDIT_KEY,
    nvl(:old.program_id,'MANUAL'),LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
