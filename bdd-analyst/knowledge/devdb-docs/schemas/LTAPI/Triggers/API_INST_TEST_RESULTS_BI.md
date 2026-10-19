---
tags:
  - trigger
  - LTAPI
---
# API_INST_TEST_RESULTS_BI

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]
**Table**: [[schemas/LTAPI/Tables/API_INST_TEST_RESULTS|API_INST_TEST_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
tmpVar NUMBER;

BEGIN
   tmpVar := 0;
   SELECT api_record_id_seq.NEXTVAL INTO tmpVar FROM dual;
   :NEW.record_id := tmpVar;
   :NEW.INSERT_Date := SYSDATE;
 --  :NEW.INSERT_User := USER;


	if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
	end if;

EXCEPTION
     WHEN OTHERS THEN
       -- Consider logging the error and then re-raise
       RAISE;


END ;
```
