---
tags:
  - trigger
  - SRVSYS
---
# VSERV_ABO_COMPATIBILITY_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_ABO_COMPATIBILITY|VSERV_ABO_COMPATIBILITY]]
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
  insert into VSERV_ABO_COMPATIBILITY_AUDIT
  (	REQUEST_ABO,
	COMPATIBLE_ABO,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	PRODUCT_TYPE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.REQUEST_ABO,
	:new.COMPATIBLE_ABO,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.PRODUCT_TYPE,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
  end ;
```
