---
tags:
  - trigger
  - SRVSYS
---
# VSERV_BILLING_CODES_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_BILLING_CODES|VSERV_BILLING_CODES]]
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
  (	:new.BILLING_CODE,
	:new.CODE_DESC,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.audit_key,
	nvl(:new.program_id,'MANUAL'),LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
  end ;
```
