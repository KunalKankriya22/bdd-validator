---
tags:
  - trigger
  - SBCSYS
---
# VALID_FILTERS_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_FILTERS|VALID_FILTERS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
	if inserting
	then
	   select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
   	   :new.audit_key := temp_audit_key;
	end if;
	:new.program_id := nvl(:new.program_id,'MANUAL');
	:new.last_modified_date := sysdate;
	Insert into valid_filters_audit(CHAPTER_ID, VENDOR_NAME,
	   NUMBER_OF_DAYS, AUDIT_KEY,  PROGRAM_ID, CATALOG_NUMBER,
	   PRODUCT_TYPE, EFF_DATE,  TERM_DATE, LAST_MODIFIED_DATE,
	   AUDIT_INSERT_DATS, AUDIT_INSERT_USER) values
	   (:new.CHAPTER_ID, :new.VENDOR_NAME,
	   :new.NUMBER_OF_DAYS, :new.AUDIT_KEY,  :new.PROGRAM_ID,
	   :new.CATALOG_NUMBER, :new.PRODUCT_TYPE, :new.EFF_DATE,
	   :new.TERM_DATE, :new.LAST_MODIFIED_DATE,
	   sysdate, lt_user_session.get_userid);
end;
```
