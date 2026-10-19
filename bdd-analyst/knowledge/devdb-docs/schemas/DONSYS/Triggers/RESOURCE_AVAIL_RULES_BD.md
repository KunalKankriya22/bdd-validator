---
tags:
  - trigger
  - DONSYS
---
# RESOURCE_AVAIL_RULES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/RESOURCE_AVAIL_RULES|RESOURCE_AVAIL_RULES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into RESOURCE_AVAIL_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		week_day,
		chapter_id,
		max_available,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.resource_code,
		:old.week_day,
		:old.chapter_id,
		:old.max_available,
		:old.eff_date,
		:old.term_date
	);
end;
```
