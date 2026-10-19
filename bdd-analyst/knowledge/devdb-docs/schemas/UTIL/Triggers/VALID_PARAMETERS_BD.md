---
tags:
  - trigger
  - UTIL
---
# VALID_PARAMETERS_BD

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/VALID_PARAMETERS|VALID_PARAMETERS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.parameter_code,
		:old.chapter_id,
		:old.parameter_type,
		:old.parameter_value,
		:old.description,
		:old.eff_date,
		:old.term_date
	);
end;
```
