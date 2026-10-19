---
tags:
  - trigger
  - UTIL
---
# EMF_PROCESS_MAPPING_BI

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/EMF_PROCESS_MAPPING|EMF_PROCESS_MAPPING]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
							  IF :new.program_id IS NULL THEN
								    :new.program_id := 'MANUAL';
								  END IF;
								  IF :new.insert_user IS NULL THEN
									     Select lt_user_session.get_userid into :new.insert_user
									       from dual ;
									  END IF;
									  IF :new.insert_date IS NULL THEN
										     :new.insert_date := SYSDATE;
										  END IF;
										  IF :new.audit_key IS NULL THEN
											     SELECT AUDIT_SEQ.nextval INTO :new.audit_key FROM dual;
											  END IF;
										end ;
```
