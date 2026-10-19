---
tags:
  - trigger
  - DONSYS
---
# VALID_DAY_STATUS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_DAY_STATUS|VALID_DAY_STATUS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.status,
		:new.chapter_id,
		:new.resource_code,
		:new.lower_limit,
		:new.upper_limit,
		:new.color_code,
		:new.eff_date,
		:new.term_date
	);
end;
```
