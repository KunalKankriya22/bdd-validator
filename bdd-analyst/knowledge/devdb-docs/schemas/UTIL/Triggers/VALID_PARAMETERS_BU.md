---
tags:
  - trigger
  - UTIL
---
# VALID_PARAMETERS_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/VALID_PARAMETERS|VALID_PARAMETERS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_PARAMETERS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		parameter_code,
		chapter_id,
		parameter_type,
		parameter_value,
		description,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.parameter_code,
		:new.chapter_id,
		:new.parameter_type,
		:new.parameter_value,
		:new.description,
		:new.eff_date,
		:new.term_date
	);
end;
```
