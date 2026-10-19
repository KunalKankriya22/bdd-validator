---
tags:
  - trigger
  - LTAPI
---
# API_ADD_TEST_INTER_BI

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_ADD_TEST_INTER|API_ADD_TEST_INTER]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE

BEGIN

   :NEW.INSERT_Date := SYSDATE;
   :NEW.INSERT_User := USER;

	if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
	end if;
END ;
```
