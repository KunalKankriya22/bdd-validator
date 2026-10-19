---
tags:
  - trigger
  - SRVSYS
---
# VSERV_ANTIGENS_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_ANTIGENS|VSERV_ANTIGENS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  insert into VSERV_ANTIGENS_AUDIT
  (	ANTIGEN_ID,
	ANTIGEN_DESC,
	PRICE,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:old.ANTIGEN_ID,
	:old.ANTIGEN_DESC,
	:old.PRICE,
	:old.EFF_DATE,
	:old.TERM_DATE,
	:old.LAST_MODIFIED_DATE,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
```
