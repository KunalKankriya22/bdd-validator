---
tags:
  - trigger
  - SRVSYS
---
# QUARANTINE_PRODUCTS_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/QUARANTINE_PRODUCTS|QUARANTINE_PRODUCTS]]
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
  insert into QUARANTINE_PRODUCTS_AUDIT
  (	CHAPTER_ID,
	UNIT_ID,
	PRODUCT_CODE,
	ALIQUOT,
	INSERT_DATE,
	INSERT_USER_ID,
	QU_REASON,
	COLL_DATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
  values
  (	:new.CHAPTER_ID,
	:new.UNIT_ID,
	:new.PRODUCT_CODE,
	:new.ALIQUOT,
	:new.INSERT_DATE,
	:new.INSERT_USER_ID,
	:new.QU_REASON,
	:new.COLL_DATE,
	:new.AUDIT_KEY,
	'INSERT',LT_USER_SESSION.GET_USERID,
    sysdate
  ) ;
end ;
```
