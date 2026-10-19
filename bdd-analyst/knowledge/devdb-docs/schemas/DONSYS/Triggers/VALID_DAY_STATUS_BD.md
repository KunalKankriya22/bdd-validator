---
tags:
  - trigger
  - DONSYS
---
# VALID_DAY_STATUS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_DAY_STATUS|VALID_DAY_STATUS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_DAY_STATUS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		status,
		chapter_id,
		resource_code,
		lower_limit,
		upper_limit,
		color_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.status,
		:old.chapter_id,
		:old.resource_code,
		:old.lower_limit,
		:old.upper_limit,
		:old.color_code,
		:old.eff_date,
		:old.term_date
	);
end;
```
