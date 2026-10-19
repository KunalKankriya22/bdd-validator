---
tags:
  - trigger
  - SBCSYS
---
# VALID_ATTRIBUTE_CONFIG_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ATTRIBUTE_CONFIG|VALID_ATTRIBUTE_CONFIG]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');

	insert into SBCSYS.VALID_ATTRIBUTE_CONFIG_AUDIT
	(
		CHAPTER_ID,PRODUCT_TYPE,ATTRIB_CLASS,
		ATTRIB_CODE,ATTRIB_MODIFIER,EFF_DATE,
		TERM_DATE,MODIFIED_DATE,LAST_MODIFIED_BY,
		INSERT_DATE,INSERT_USER,PROGRAM_ID,FCN_NAME,
		AUDIT_KEY,AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(
		:NEW.CHAPTER_ID,:NEW.PRODUCT_TYPE,:NEW.ATTRIB_CLASS,
		:NEW.ATTRIB_CODE,:NEW.ATTRIB_MODIFIER,:NEW.EFF_DATE,
		:NEW.TERM_DATE,:NEW.MODIFIED_DATE,:NEW.LAST_MODIFIED_BY,
		:NEW.INSERT_DATE,:NEW.INSERT_USER,:NEW.PROGRAM_ID,:NEW.FCN_NAME,
		:NEW.AUDIT_KEY,SYSDATE,lt_user_session.get_userid
	);

end;
```
