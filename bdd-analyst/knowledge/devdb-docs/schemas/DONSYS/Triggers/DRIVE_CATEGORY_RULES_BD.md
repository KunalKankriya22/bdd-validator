---
tags:
  - trigger
  - DONSYS
---
# DRIVE_CATEGORY_RULES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_CATEGORY_RULES|DRIVE_CATEGORY_RULES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into DRIVE_CATEGORY_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		rule_id,
		chapter_id,
		drive_category,
		number_allowed,
		max_size,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.rule_id,
		:old.chapter_id,
		:old.drive_category,
		:old.number_allowed,
		:old.max_size,
		:old.eff_date,
		:old.term_date
	);
end;
```
